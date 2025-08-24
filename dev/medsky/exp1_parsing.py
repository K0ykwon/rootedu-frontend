from llama_cloud_services import LlamaParse
import os 
from dotenv import load_dotenv
import json 

load_dotenv()

LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")

parser = LlamaParse(
    api_key=LLAMA_API_KEY,
    parse_mode="parse_page_without_llm",
    high_res_ocr=True,
    outlined_table_extraction=True,
    output_tables_as_HTML=True
)

file_path = "dev/medsky/file/park/park_sample.pdf"

result = parser.parse(file_path)

for page in result.pages:
    with open("dev/file/park_sample_parsed.txt", "a") as f:
        f.write(page.text)