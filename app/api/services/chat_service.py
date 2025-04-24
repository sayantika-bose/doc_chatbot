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

    def _prioritize_chunks(self, question: str, chunks: list) -> list:
        """
        Process and prioritize chunks by estimated relevance to the question.
        
        This method:
        1. Keeps the most relevant chunks based on keyword matching
        2. Makes sure we're not exceeding model context limitations
        3. Removes any duplicate or highly similar chunks
        
        Args:
            question: The user's question
            chunks: List of text chunks from the document
            
        Returns:
            A processed list of chunks optimized for the LLM's context window
        """
        if not chunks:
            return []
            
        try:
            # 1. Simple keyword prioritization
            # Extract keywords from the question (remove common words)
            common_words = {"what", "where", "when", "who", "how", "why", "is", "are", "the", "a", "an", "and", "in", "on", "at", "to", "for", "with", "of", "by", "about", "like", "as", "from"}
            keywords = [word.lower() for word in question.split() if word.lower() not in common_words]
            
            # Score chunks based on keyword occurrences
            scored_chunks = []
            for chunk in chunks:
                # Skip very short chunks (likely metadata or headers)
                if len(chunk) < 50:
                    continue
                    
                # Calculate a simple relevance score
                chunk_lower = chunk.lower()
                score = sum(chunk_lower.count(keyword) for keyword in keywords)
                
                # Boost score if chunk contains exact phrases from question
                for i in range(len(keywords) - 1):
                    if f"{keywords[i]} {keywords[i+1]}".lower() in chunk_lower:
                        score += 3  # Bonus for consecutive keywords
                        
                scored_chunks.append((chunk, score))
            
            # Sort by score (highest first)
            scored_chunks.sort(key=lambda x: x[1], reverse=True)
            
            # 2. Keep the highest scoring chunks within our limit
            # For Gemini Pro, we'll aim to keep total context under ~100k tokens
            MAX_CHARS = 50000  # Conservative estimate based on the model's capabilities
            kept_chunks = []
            current_length = 0
            
            # Always keep top scoring chunk regardless of size
            if scored_chunks:
                kept_chunks.append(scored_chunks[0][0])
                current_length += len(scored_chunks[0][0])
            
            # Add more chunks until we hit our size limit
            for chunk, score in scored_chunks[1:]:
                # Skip if this chunk would exceed our limit
                if current_length + len(chunk) > MAX_CHARS:
                    continue
                    
                # Skip near-duplicate chunks (>80% similar to any existing chunk)
                if any(self._similarity_ratio(chunk, kept) > 0.8 for kept in kept_chunks):
                    continue
                    
                kept_chunks.append(chunk)
                current_length += len(chunk)
                
                # Stop if we've reached our character limit
                if current_length >= MAX_CHARS:
                    break
                    
            logger.info(f"Prioritized chunks: keeping {len(kept_chunks)}/{len(chunks)} chunks (total {current_length} chars)")
            return kept_chunks
            
        except Exception as e:
            logger.warning(f"Error in chunk prioritization: {str(e)}, using original chunks")
            return chunks[:min(len(chunks), 50)]  # Fallback to first 50 chunks if processing fails
            
    def _similarity_ratio(self, str1: str, str2: str) -> float:
        """
        Calculate a simple similarity ratio between two strings.
        Returns a value between 0 (completely different) and 1 (identical).
        """
        # Simple length-based quick check
        if abs(len(str1) - len(str2)) / max(len(str1), len(str2)) > 0.5:
            return 0.0
            
        # Use a basic set comparison of words for speed
        words1 = set(str1.lower().split())
        words2 = set(str2.lower().split())
        
        if not words1 or not words2:
            return 0.0
            
        # Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        return intersection / union if union > 0 else 0.0
    
    async def _get_prompt(self, template_name: str, **kwargs):
        """
        This method has been updated to bypass ChatPromptTemplate since we're 
        now using a more direct approach with HumanMessage.
        
        It still renders the Jinja2 template but returns the raw text
        instead of creating a ChatPromptTemplate.
        """
        try:
            logger.info(f"Loading prompt template: {template_name}")
            template = self.jinja_env.get_template(template_name)
            prompt_text = template.render(**kwargs)
            
            # Log a truncated version of the prompt to avoid excessive logging
            truncated_prompt = prompt_text[:500] + "..." if len(prompt_text) > 500 else prompt_text
            logger.info(f"Rendered prompt template: {truncated_prompt}")
            
            # Return the raw prompt text instead of creating a ChatPromptTemplate
            return prompt_text
        except Exception as e:
            logger.error(f"Error getting prompt template {template_name}: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    async def get_response(self, document_id: str, question: str) -> str:
        logger.info(f"Processing chat request for document_id: {document_id}")
        logger.info(f"Question: {question}")
        
        try:
            # Get relevant context with increased k value (150) for better coverage
            logger.info("Retrieving relevant chunks from document...")
            contexts = await self.indexer_service.get_relevant_chunks(question, document_id, k=150)
            
            if not contexts:
                logger.warning(f"No relevant chunks found for document {document_id} and question: {question}")
                return "No relevant context found for this question. Please try rephrasing or ask about something covered in the document."

            logger.info(f"Found {len(contexts)} relevant chunks")
            
            # Process and prioritize chunks by estimated relevance
            processed_contexts = self._prioritize_chunks(question, contexts)
            logger.info(f"Processed and prioritized {len(processed_contexts)} chunks for improved relevance")
            
            # Use both approaches (render template and direct string) for robustness
            logger.info("Trying to use template with context preprocessing...")
            
            # Escape any content that might contain template syntax characters
            # This helps prevent the ValueError: Single '}' encountered in format string
            # caused by user documents with special characters
            safe_contexts = []
            for ctx in processed_contexts:  # Use the prioritized contexts
                # Replace any potentially problematic characters in the context
                # This is a robust approach to handle any special syntax
                safe_ctx = ctx.replace('{', '{{').replace('}', '}}')
                safe_contexts.append(safe_ctx)
            
            try:
                # Use template (now safely rendered)
                template_prompt = await self._get_prompt(
                    "system_prompt.j2",
                    contexts=safe_contexts,
                    question=question.replace('{', '{{').replace('}', '}}')
                )
                
                # If template rendering succeeds, use it as our prompt
                prompt = template_prompt
                logger.info("Successfully used template prompt")
            except Exception as template_error:
                # Fallback to direct string format if template fails
                logger.warning(f"Template approach failed: {str(template_error)}, using fallback direct format")
                
                # Join contexts with separator for the fallback approach
                context_text = "\n---\n".join(processed_contexts)
                
                # Create a simple prompt format that works reliably with Gemini
                prompt = f"""Please answer the question based on this context:

Context:
{context_text}

Question: {question}

Answer:"""
                
            # Log preview of the final prompt used
            logger.info(f"Final prompt preview: {prompt[:100]}...")
            
            # Create a human message with the prompt
            message = HumanMessage(content=prompt)
            
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
