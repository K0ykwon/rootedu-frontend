# -*- coding: utf-8 -*-
import re
import os

def parse_creative_activities(file_path):
    """
    Extract the creative activities section from a student record file.
    
    Args:
        file_path (str): Path to the parsed student record file
    
    Returns:
        str: The extracted creative activities section
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to match from "6. 창의적 체험활동상황" to "7. 교과학습발달상황"
    pattern = r'6\.\s*창의적\s*체험활동상황.*?(?=7\.\s*교과학습발달상황)'
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    else:
        return ""

def parse_academic_development(file_path):
    """
    Extract the academic development section from a student record file.
    
    Args:
        file_path (str): Path to the parsed student record file
    
    Returns:
        str: The extracted academic development section
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to match from "7. 교과학습발달상황" to first "세부능력 및 특기사항"
    pattern = r'7\.\s*교과학습발달상황.*?(?=세부능력\s*및\s*특기사항)'
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    else:
        return ""

def parse_detailed_abilities(file_path):
    """
    Extract the detailed abilities and specialties section from a student record file.
    
    Args:
        file_path (str): Path to the parsed student record file
    
    Returns:
        str: The extracted detailed abilities section
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to match from first "세부능력 및 특기사항" to "8. 독서활동상황"
    pattern = r'세부능력\s*및\s*특기사항.*?(?=8\.\s*독서활동상황)'
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    else:
        return ""

def parse_reading_activities(file_path):
    """
    Extract the reading activities section from a student record file.
    
    Args:
        file_path (str): Path to the parsed student record file
    
    Returns:
        str: The extracted reading activities section
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to match from "8. 독서활동상황" to "9. 행동특성 및 종합의견"
    pattern = r'8\.\s*독서활동상황.*?(?=9\.\s*행동특성\s*및\s*종합의견)'
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    else:
        return ""

def parse_behavioral_characteristics(file_path):
    """
    Extract the behavioral characteristics and comprehensive opinions section from a student record file.
    
    Args:
        file_path (str): Path to the parsed student record file
    
    Returns:
        str: The extracted behavioral characteristics section
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to match from "9. 행동특성 및 종합의견" to end of file
    pattern = r'9\.\s*행동특성\s*및\s*종합의견.*'
    
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    else:
        return ""

def save_parsed_sections(file_path):
    """
    Parse all sections and save them to separate files in the park directory.
    
    Args:
        file_path (str): Path to the parsed student record file
    """
    # Create output directory
    output_dir = "/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/dev/file/park"
    os.makedirs(output_dir, exist_ok=True)
    
    # Parse all sections
    sections = {
        "1_creative_activities.txt": parse_creative_activities(file_path),
        "2_academic_development.txt": parse_academic_development(file_path),
        "3_detailed_abilities.txt": parse_detailed_abilities(file_path),
        "4_reading_activities.txt": parse_reading_activities(file_path),
        "5_behavioral_characteristics.txt": parse_behavioral_characteristics(file_path)
    }
    
    # Save each section to separate files
    for filename, content in sections.items():
        if content:
            output_path = os.path.join(output_dir, filename)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {filename} saved ({len(content)} characters)")
        else:
            print(f"❌ {filename} - 섹션을 찾을 수 없습니다.")

if __name__ == "__main__":
    file_path = "/Users/gangjimin/Documents/main_dev/rootedu/rootedu-platform/dev/file/park/park_sample_parsed.txt"
    
    # Parse and save all sections
    save_parsed_sections(file_path)
    
    print("\n" + "="*50 + "\n")
    
    # Test new parsing functions
    print("=== 독서활동상황 섹션 ===")
    reading_activities = parse_reading_activities(file_path)
    if reading_activities:
        print(reading_activities[:300] + "..." if len(reading_activities) > 300 else reading_activities)
    else:
        print("섹션을 찾을 수 없습니다.")
    
    print("\n" + "="*30 + "\n")
    
    print("=== 행동특성 및 종합의견 섹션 ===")
    behavioral_characteristics = parse_behavioral_characteristics(file_path)
    if behavioral_characteristics:
        print(behavioral_characteristics[:300] + "..." if len(behavioral_characteristics) > 300 else behavioral_characteristics)
    else:
        print("섹션을 찾을 수 없습니다.")