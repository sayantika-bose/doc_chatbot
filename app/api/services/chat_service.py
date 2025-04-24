from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, SystemMessage
from jinja2 import Environment, FileSystemLoader
import os
import logging
import traceback
from api.config.settings import get_settings
from api.services.indexer_service import IndexerService

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ChatService")

settings = get_settings()

class ChatService:
    def __init__(self):
        logger.info("Initializing ChatService")
        try:
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                logger.info("GOOGLE_API_KEY environment variable not found, trying settings")
                api_key = settings.GOOGLE_API_KEY
                
            if not api_key:
                logger.error("GOOGLE_API_KEY not found in environment or settings!")
                raise ValueError("GOOGLE_API_KEY environment variable is not set")
            else:
                logger.info("GOOGLE_API_KEY found and set successfully")
            
            logger.info("Initializing ChatGoogleGenerativeAI with model=gemini-pro")
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.7
            )
            
            logger.info("Initializing IndexerService")
            self.indexer_service = IndexerService()
            
            # Get prompts directory
            prompts_dir = os.path.join(os.path.dirname(__file__), "..", "prompts")
            logger.info(f"Loading prompt templates from: {prompts_dir}")
            
            if not os.path.exists(prompts_dir):
                logger.warning(f"Prompts directory not found: {prompts_dir}")
                
            self.jinja_env = Environment(
                loader=FileSystemLoader(prompts_dir)
            )
            self.output_parser = StrOutputParser()
            logger.info("ChatService initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing ChatService: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def _get_prompt(self, template_name: str, **kwargs):
        try:
            logger.info(f"Loading prompt template: {template_name}")
            template = self.jinja_env.get_template(template_name)
            prompt_text = template.render(**kwargs)
            
            # Log a truncated version of the prompt to avoid excessive logging
            truncated_prompt = prompt_text[:500] + "..." if len(prompt_text) > 500 else prompt_text
            logger.info(f"Rendered prompt template: {truncated_prompt}")
            
            return ChatPromptTemplate.from_messages([
                ("system", prompt_text)
            ])
        except Exception as e:
            logger.error(f"Error getting prompt template {template_name}: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def get_response(self, document_id: str, question: str) -> str:
        logger.info(f"Processing chat request for document_id: {document_id}")
        logger.info(f"Question: {question}")
        
        try:
            # Get relevant context
            logger.info("Retrieving relevant chunks from document...")
            contexts = await self.indexer_service.get_relevant_chunks(question, document_id)
            
            if not contexts:
                logger.warning(f"No relevant chunks found for document {document_id} and question: {question}")
                return "No relevant context found for this question. Please try rephrasing or ask about something covered in the document."

            logger.info(f"Found {len(contexts)} relevant chunks")
            
            # Create prompt
            logger.info("Creating prompt with context and question...")
            prompt = await self._get_prompt(
                "system_prompt.j2",
                contexts=contexts,
                question=question
            )

            # Use a simple direct approach with the LLM
            logger.info("Using simplified approach with direct HumanMessage...")
            
            # Join contexts with separator
            context_text = "\n---\n".join(contexts)
            
            # Create a simple prompt format that works reliably with Gemini
            simplified_prompt = f"""Please answer the question based on this context:

Context:
{context_text}

Question: {question}

Answer:"""
            
            logger.info(f"Simplified prompt preview: {simplified_prompt[:100]}...")
            
            # Create a human message with the prompt
            message = HumanMessage(content=simplified_prompt)
            
            # Call the LLM directly with the human message
            logger.info("Invoking LLM for response generation...")
            llm_response = await self.llm.ainvoke([message])
            
            # Parse the response
            response = self.output_parser.invoke(llm_response)
            
            # Log a truncated version of the response
            truncated_response = response[:200] + "..." if len(response) > 200 else response
            logger.info(f"Generated response: {truncated_response}")

            return response
            
        except Exception as e:
            logger.error(f"Error getting chat response: {str(e)}")
            logger.error(traceback.format_exc())
            raise
