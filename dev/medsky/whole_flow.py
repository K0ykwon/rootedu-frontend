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

parsed_text = ""
for page in result.pages:
    parsed_text += page.text

from exp2_parsing_via_regex import parse_detailed_abilities, parse_academic_development, parse_behavioral_characteristics, parse_creative_activities, parse_reading_activities


reading_activities = parse_reading_activities(parsed_text)
academic_development = parse_academic_development(parsed_text)
detailed_abilities = parse_detailed_abilities(parsed_text)
behavioral_characteristics = parse_behavioral_characteristics(parsed_text)
creative_activities = parse_creative_activities(parsed_text)



from exp4_extraction import parse_academic_development, parse_creative_activity, parse_detailed_ability

academic_development_extracted = parse_academic_development(academic_development)
creative_activity_extracted = parse_creative_activity(creative_activities)
detailed_ability_extracted = parse_detailed_ability(detailed_abilities)

from exp5_validation import validate_text

for validation_type in ["blue_highlight", "red_line", "blue_line", "black_line", "red_check"]:
    academic_development_validation = validate_text(academic_development_extracted, validation_type)
    creative_activity_validation = validate_text(creative_activity_extracted, validation_type)
    detailed_ability_validation = validate_text(detailed_ability_extracted, validation_type)


