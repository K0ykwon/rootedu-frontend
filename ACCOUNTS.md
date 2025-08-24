# RootEdu Platform - Account Documentation

## Overview
This document lists all pre-created accounts in the RootEdu platform after the authentication system update from email-based to userId/phoneNumber-based authentication.

## Authentication System
- **Login Method**: User ID + Password
- **User Types**: Student, Parent
- **Roles**: admin, influencer, (regular users have no role)
- **Phone Number**: Required for all accounts

---

## Admin Account

### Administrator Account
- **Username**: `admin`
- **Password**: `passwordadmin`
- **Name**: Administrator
- **Phone Number**: `010-0000-0000`
- **User Type**: parent
- **Role**: admin
- **Permissions**: 
  - Access to admin dashboard
  - View all medsky analysis data
  - Manage user accounts
  - System administration

---

## Influencer Accounts

All influencer accounts have been created with the following structure:

### 1. 알약툰 (YakToon)
- **Username**: `yaktoon`
- **Password**: `yaktoon2024!`
- **Name**: 알약툰
- **Phone Number**: `010-1001-0001`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `yaktoon`
- **Specialization**: Medical, SKY 출신 대학 멘토들의 대입 컨설팅
- **Services**: 생기부관리, 수시 컨설팅, 정시 컨설팅
- **Instagram**: [@yaktoon](https://instagram.com/yaktoon)
- **Followers**: 24,700

### 2. 하나쌤 (Hana)
- **Username**: `hana`
- **Password**: `hana2024!`
- **Name**: 하나쌤
- **Phone Number**: `010-1002-0002`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `hana`
- **Specialization**: 초, 중, 고 학습 & 진로설계, 20년 현장 경험
- **Services**: 학부모상담, 공부법 관리, 멘탈관리
- **Instagram**: [@studypacer_hana](https://instagram.com/studypacer_hana)
- **Followers**: 21,400

### 3. 부모노트 (Parents Note)
- **Username**: `parantsnote`
- **Password**: `parants2024!`
- **Name**: 부모노트
- **Phone Number**: `010-1003-0003`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `parantsnote`
- **Specialization**: 대기업연구원, 육아서 2권 출간, 조선일보 칼럼기고 6년
- **Services**: 맞춤공부, 학부모코칭, 학습코치
- **Instagram**: [@parants.note](https://instagram.com/parants.note)
- **Followers**: 21,400

### 4. 테리영어 (Terry English)
- **Username**: `terry`
- **Password**: `terry2024!`
- **Name**: 테리영어
- **Phone Number**: `010-1004-0004`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `terry`
- **Specialization**: 토론토대학교 언어학과, 케나다/한국 이중국적, 25년 영어과외 경력
- **Services**: 시간절약영어, 실전회화
- **Instagram**: [@terry_english153](https://instagram.com/terry_english153)
- **Followers**: 21,400

### 5. 유노바 (Unova)
- **Username**: `unova`
- **Password**: `unova2024!`
- **Name**: 유노바
- **Phone Number**: `010-1005-0005`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `unova`
- **Specialization**: 최상위권 선생님들이 집필한 올인원 수능 과외책 및 코칭
- **Services**: 문제풀이 알고리즘, 수학코칭, 물리코칭
- **Instagram**: [@unova_study](https://instagram.com/unova_study)
- **Followers**: 6,571

### 6. 길품국어 (Korean Language Arts)
- **Username**: `korartis`
- **Password**: `korartis2024!`
- **Name**: 길품국어
- **Phone Number**: `010-1006-0006`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `kor.artis`
- **Specialization**: 고려대학교 국어국문학과, 수능 국어 길잡이
- **Services**: 국어코칭, 맞춤독해루틴, 어휘력성정
- **Instagram**: [@kor.artis](https://instagram.com/kor.artis)
- **Followers**: 8,935

### 7. 크리스틴영어 (Christine English)
- **Username**: `christine`
- **Password**: `christine2024!`
- **Name**: 크리스틴영어
- **Phone Number**: `010-1007-0007`
- **User Type**: parent
- **Role**: influencer
- **Influencer Slug**: `christine`
- **Specialization**: 14년차 영어강사, 영어를 통한 당신의 변화를 돕습니다
- **Services**: 비즈니스영어, 취업영어, 실전회화
- **Instagram**: [@englishlab_christine](https://instagram.com/englishlab_christine)
- **Followers**: 8,681

---

## Account Summary

| Role | Count | Details |
|------|-------|---------|
| Admin | 1 | System administrator with full access |
| Influencer | 7 | Content creators with specialized educational services |
| **Total** | **8** | **All accounts created and ready for use** |

---

## Security Notes

1. **Password Policy**: All accounts use strong passwords with special characters
2. **Role-Based Access**: Admin and influencer roles have specific permissions
3. **Redis Storage**: All accounts stored securely in Redis with bcrypt password hashing
4. **Phone Verification**: All accounts have assigned phone numbers for future verification
5. **User Type Classification**: All accounts are set as 'parent' type (influencers and admin)

---

## Usage Instructions

### Login Process
1. Navigate to `/auth/login`
2. Enter **Username** (not email)
3. Enter **Password**
4. Users will be redirected based on their role:
   - **Admin**: Access to admin dashboard and medsky analytics
   - **Influencer**: Access to influencer-specific features (to be implemented)
   - **Regular users**: Standard platform access

### Account Management
- All accounts are managed through Redis
- Password changes require script execution or admin intervention
- New user registrations will follow the phone number + userId pattern

---

## Related Files

- `/scripts/create-admin.ts` - Admin account creation script
- `/scripts/create-influencers.ts` - Influencer accounts creation script
- `/lib/auth.ts` - Authentication configuration
- `/lib/redis.ts` - User interface and Redis client setup

---

*Last Updated: 2024-12-19*
*Platform: RootEdu Next.js Application*