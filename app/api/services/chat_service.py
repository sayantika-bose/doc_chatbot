from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from jinja2 import Environment, FileSystemLoader
import os
from api.config.settings import get_settings
from api.services.indexer_service import IndexerService

settings = get_settings()

class ChatService:
    def __init__(self):
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
            
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=api_key,
            temperature=0.7
        )
        self.indexer_service = IndexerService()
        self.jinja_env = Environment(
            loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "..", "prompts"))
        )
        self.output_parser = StrOutputParser()

    async def _get_prompt(self, template_name: str, **kwargs):
        template = self.jinja_env.get_template(template_name)
        prompt_text = template.render(**kwargs)
        return ChatPromptTemplate.from_messages([
            ("system", prompt_text)
        ])

    async def get_response(self, document_id: str, question: str) -> str:
        # Get relevant context
        contexts = await self.indexer_service.get_relevant_chunks(question, document_id)
        
        if not contexts:
            return "No relevant context found for this question. Please try rephrasing or ask about something covered in the document."

        # Create prompt
        prompt = await self._get_prompt(
            "system_prompt.j2",
            contexts=contexts,
            question=question
        )

        # Create and execute RAG chain
        rag_chain = (
            {"context": RunnablePassthrough(), "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | self.output_parser
        )

        response = await rag_chain.ainvoke({
            "context": contexts,
            "question": question
        })

        return response
