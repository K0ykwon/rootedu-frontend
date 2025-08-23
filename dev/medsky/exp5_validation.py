from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os 
import json 
import asyncio 
from validation_prompts import get_validation_prompt

load_dotenv()

client = AsyncOpenAI(
    base_url=os.getenv("OPENROUTER_BASE_URL"),
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

class Feedback(BaseModel):
    sentence: str = Field(description="평가된 컨텐츠에서 피드백 대상이 되는 문장. 원본 텍스트와 반드시 동일하게 작성해야 함.")
    feedback: str = Field(description="컨텐츠에 대한 피드백. 해당 피드백을 왜 제시하게 됐는지에 대한 설명")


class ValidationOutput(BaseModel):
    type: Literal["red_line", "red_check", "blue_line", "blue_highlight", "black_line"]
    Feedbacks: List[Feedback] = Field(description="The list of Feedbacks for the validation")


async def validate_text(text: str, validation_type: str, max_retries: int = 3):
    """
    Run validation analysis on given text with specified validation type.
    
    Args:
        text (str): The text content to validate
        validation_type (str): One of 'blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check'
        max_retries (int): Maximum number of retry attempts
    
    Returns:
        ValidationOutput: The validation result
    """
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.parse(
                model="deepseek/deepseek-chat-v3.1",
                messages=[
                    {"role": "system", "content": get_validation_prompt(validation_type)},
                    {"role": "user", "content": text}  # Limit text length to prevent truncation
                ],
                response_format=ValidationOutput,
            )
            return response.choices[0].message.parsed
        except Exception as e:
            print(f"⚠️  Attempt {attempt + 1} failed for {validation_type}: {str(e)[:100]}...")
            if attempt == max_retries - 1:
                # Return empty result on final failure
                return ValidationOutput(
                    type=validation_type,
                    Feedbacks=[
                        Feedback(
                            sentence="오류로 인해 분석을 완료할 수 없었습니다.",
                            feedback=f"API 오류 또는 JSON 파싱 실패: {str(e)[:200]}"
                        )
                    ]
                )
            await asyncio.sleep(1)  # Wait before retry

async def run_all_validations():
    """
    Run all 15 validation combinations (5 validation types × 3 text files) in parallel.
    """
    # Define file paths and validation types
    file_paths = {
        'creative_activities': 'dev/file/park/1_creative_activities.txt',
        'academic_development': 'dev/file/park/2_academic_development.txt', 
        'detailed_abilities': 'dev/file/park/3_detailed_abilities.txt'
    }
    
    validation_types = ['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']
    
    # Load all text files
    text_contents = {}
    for file_key, file_path in file_paths.items():
        with open(file_path, 'r', encoding='utf-8') as f:
            text_contents[file_key] = f.read()
    
    # Create validation tasks
    validation_tasks = []
    task_info = []
    
    for file_key, text_content in text_contents.items():
        for validation_type in validation_types:
            task = validate_text(text_content, validation_type)
            validation_tasks.append(task)
            task_info.append({
                'file_key': file_key,
                'validation_type': validation_type,
                'output_filename': f"{file_key}_{validation_type}.json"
            })
    
    # Run all validations in parallel
    print("🚀 Starting all 15 validation tasks in parallel...")
    results = await asyncio.gather(*validation_tasks, return_exceptions=True)
    
    # Create output directory
    output_dir = "dev/validation_results"
    os.makedirs(output_dir, exist_ok=True)
    
    # Save results to separate JSON files
    for result, info in zip(results, task_info):
        if isinstance(result, Exception):
            print(f"❌ {info['output_filename']} failed: {str(result)[:100]}")
            # Create error result
            result = ValidationOutput(
                type=info['validation_type'],
                Feedbacks=[
                    Feedback(
                        sentence="처리 중 오류가 발생했습니다.",
                        feedback=f"처리 오류: {str(result)[:200]}"
                    )
                ]
            )
        
        # Save result
        output_path = os.path.join(output_dir, info['output_filename'])
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result.model_dump(), f, ensure_ascii=False, indent=2)
        
        feedback_count = len(result.Feedbacks)
        print(f"✅ {info['output_filename']} saved ({feedback_count} feedbacks)")
    
    print(f"\n🎉 All 15 validation results saved to {output_dir}/")
    return results

async def main():
    """Main function to run all validations."""
    await run_all_validations()

if __name__ == "__main__":
    asyncio.run(main())
