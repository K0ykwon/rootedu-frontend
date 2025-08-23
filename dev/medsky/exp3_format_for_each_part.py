from pydantic import BaseModel, Field
from typing import List, Dict, Optional 

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