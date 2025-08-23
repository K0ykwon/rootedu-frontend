from pydantic import BaseModel, Field
from typing import List, Dict, Optional 
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os 
from extraction_prompts import get_extraction_prompt
import json 
import asyncio 

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_BASE_URL"),
)

class CreativeActivity(BaseModel):
    영역: str = Field(description="해당 창의적 체험활동상황의 영역. 영역 column of table e.g - 자율활동, 동아리활동, ...")
    시간: int = Field(description="해당 창의적 체험활동상황의 시간. 시간 column of table")
    특기사항: str = Field(description="해당 창의적 체험활동상황의 특기사항. 특기사항 column of table")

class CreativeActivities(BaseModel):
    창의적체험활동상황: List[CreativeActivity] = Field(description="The list of creative activities")


class AcademicDevelopment(BaseModel):
    과목: str = Field(description="해당 교과학습발달상황의 과목. 과목 column of table e.g - 수학, 과학, ...")
    학점수: int = Field(description="해당 교과학습발달상황의 학점수. 학점수 column of table")
    score_over_average: str = Field(description="해당 교과학습발달상황의 원점수/과목평균. 원점수/과목평균 column of table")
    성취도: str = Field(description="해당 교과학습발달상황의 성취도. 성취도 column of table")
    석차등급: str = Field(description="해당 교과학습발달상황의 석차등급. 석차등급 column of table")
    


class AcademicDevelopments(BaseModel):
    교과학습발달상황: List[AcademicDevelopment] = Field(description="The list of academic developments")


class DetailedAbility(BaseModel):
    과목: str = Field(description="해당 세부특기사항의 과목.")
    특기사항: str = Field(description="해당 과목의 특기사항.")

class DetailedAbilities(BaseModel):
    세부특기사항: List[DetailedAbility] = Field(description="The list of detailed abilities")


async def parse_creative_activity(raw_text: str):
    response = await client.chat.completions.parse(
        model="deepseek/deepseek-chat-v3.1",
        messages=[
            {"role": "system", "content": get_extraction_prompt("creative")},
            {"role": "user", "content": raw_text}
        ],
        response_format=CreativeActivities
    )
    return response.choices[0].message.parsed

async def parse_academic_development(raw_text: str):
    response = await client.chat.completions.parse(
        model="deepseek/deepseek-chat-v3.1",
        messages=[
            {"role": "system", "content": get_extraction_prompt("academic")},
            {"role": "user", "content": raw_text}
        ],
        response_format=AcademicDevelopments
    )
    return response.choices[0].message.parsed

async def parse_detailed_ability(raw_text: str):
    response = await client.chat.completions.parse(
        model="deepseek/deepseek-chat-v3.1",
        messages=[
            {"role": "system", "content": get_extraction_prompt("detailed")},
            {"role": "user", "content": raw_text}
        ],
        response_format=DetailedAbilities
    )
    return response.choices[0].message.parsed

async def main():
    # Load text files
    with open("dev/file/park/1_creative_activities.txt", "r", encoding="utf-8") as f:
        creative_activity_text = f.read()

    with open("dev/file/park/2_academic_development.txt", "r", encoding="utf-8") as f:
        academic_development_text = f.read()

    with open("dev/file/park/3_detailed_abilities.txt", "r", encoding="utf-8") as f:
        detailed_ability_text = f.read()

    # Create tasks and run them concurrently
    tasks = [
        parse_creative_activity(creative_activity_text),
        parse_academic_development(academic_development_text),
        parse_detailed_ability(detailed_ability_text)
    ]

    results = await asyncio.gather(*tasks)

    # Save results to JSON files
    with open("dev/file/park/1_creative_activities_parsed.json", "w", encoding="utf-8") as f:
        json.dump(results[0].model_dump(), f, ensure_ascii=False, indent=2)

    with open("dev/file/park/2_academic_development_parsed.json", "w", encoding="utf-8") as f:
        json.dump(results[1].model_dump(), f, ensure_ascii=False, indent=2)

    with open("dev/file/park/3_detailed_abilities_parsed.json", "w", encoding="utf-8") as f:
        json.dump(results[2].model_dump(), f, ensure_ascii=False, indent=2)

    print("✅ All extractions completed and saved to JSON files")

if __name__ == "__main__":
    asyncio.run(main())