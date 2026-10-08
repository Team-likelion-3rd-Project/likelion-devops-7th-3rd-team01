# AI 뉴스 브리핑 (AI News Briefing)

> **협업이 처음이신가요?** 이슈 생성부터 PR 머지까지 전 과정은 [협업 가이드](./docs/GUIDE.md)를 먼저 읽어주세요.

![Team](https://img.shields.io/badge/Team-team--01-151515?style=for-the-badge)
![React](https://img.shields.io/badge/React-151515?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-151515?style=for-the-badge&logo=springboot&logoColor=6DB33F)
![MySQL](https://img.shields.io/badge/MySQL-151515?style=for-the-badge&logo=mysql&logoColor=4479A1)
![Redis](https://img.shields.io/badge/Redis-151515?style=for-the-badge&logo=redis&logoColor=FF4438)
![Kubernetes](https://img.shields.io/badge/Kubernetes-151515?style=for-the-badge&logo=kubernetes&logoColor=326CE5)
![Terraform](https://img.shields.io/badge/Terraform-151515?style=for-the-badge&logo=terraform&logoColor=844FBA)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-151515?style=for-the-badge&logo=githubactions&logoColor=2088FF)
![AWS](https://img.shields.io/badge/AWS-151515?style=for-the-badge&logo=amazonwebservices&logoColor=FF9900)

> **매일 쏟아지는 뉴스를 챙기기 버거운 사람을 위해, AI가 6개 분야의 주요 이슈를 기사 근거와 함께 요약하고 궁금한 점에 기사 기반으로 답해 주는 서비스**

[![데모 영상](https://img.youtube.com/vi/{{YOUTUBE_ID}}/maxresdefault.jpg)]({{YOUTUBE_URL}})

정치·경제·사회·생활/문화·IT/과학·스포츠 6개 분야의 뉴스를 서버가 30분마다 미리 요약해 두고, 누구나 로그인 없이 바로 볼 수 있습니다. 로그인한 사용자는 "클라우드 기업 전망 알려줘"처럼 질문하면 관련 기사를 찾아 AI가 그 기사만 근거로 답하고, 모든 답에는 원문 링크가 붙습니다. 서비스는 작게 만들고, **같은 서비스를 온프레미스 → AWS EC2 → Terraform으로 만든 AWS 환경 순서로 세 번 배포하며 배포를 점점 자동화하는 것**이 이 프로젝트의 핵심 목표입니다.

- **배포 주소:** {{https://example.com}}
- **시연 영상:** [YouTube]({{YOUTUBE_URL}})
- **문서 최종 정리일:** `YYYY-MM-DD` / **구현 기준일:** `YYYY-MM-DD`

---

## 팀 구성

| 이름 | 역할 | 담당 | GitHub |
|------|------|------|--------|
| 김상협 | 온프레미스 (ON) | VM·kubeadm 개발 클러스터, develop 자동 배포, 모니터링, 백업·복구 | [@HyeobSang](https://github.com/HyeobSang) |
| 김차니 | 클라우드 (CL) | AWS 3Tier, main 운영 배포, Terraform, 비용 관리 | [@chaneee93](https://github.com/chaneee93) |
| 이용민 | 백엔드 (BE) | 뉴스 수집·AI 요약, 질문 처리, API·인증, 성능 테스트 | [@leeym27](https://github.com/leeym27) |
| 박영찬 | 프론트엔드 (FE) | 홈·분야·질문 결과·마이페이지 화면, 정적 배포 | [@ycpark8156](https://github.com/ycpark8156) |

---

## 빠른 심사 흐름 (5분)

> 심사위원·멘토가 5분 안에 핵심 기능을 확인할 수 있는 순서로 작성합니다.

1. 위 영상 썸네일을 클릭해 전체 시연을 확인합니다.
2. {{배포 주소}} 를 엽니다.
3. 테스트 계정으로 로그인합니다. (`ID: {{demo}}` / `PW: {{demo1234}}`)
4. {{핵심 기능 1}} 을 실행합니다.
5. {{핵심 기능 2}} 결과 화면에서 {{확인 포인트}} 를 확인합니다.

---

## Core Design

- **AI는 기사만 근거로 답한다** — 서비스가 가져온 기사만 정리하고 근거 링크를 붙이며, 의견이나 예측을 쓰지 않습니다. 뉴스와 무관한 질문(코드 작성, 번역, 잡담)은 거절합니다.
- **요약은 미리 만들고, 사용자는 읽기만 한다** — 30분마다 서버가 요약을 만들어 저장하므로 접속자가 늘어도 AI 비용이 늘지 않습니다. 같은 시각에는 모든 사용자가 같은 요약을 봅니다.
- **오래 걸리는 질문은 접수와 처리를 나눈다** — 질문은 즉시 DB에 기록하고 대기열을 거쳐 워커가 처리합니다. 질문 상태의 기준은 항상 DB이므로 대기열 항목이 사라져도 다시 처리됩니다.
- **외부 장애가 사용자 오류로 번지지 않는다** — 요약 갱신에 실패하면 직전 요약을 보여주고, AI·뉴스 API 실패는 질문의 실패 상태로만 드러납니다. Redis가 멈춰도 DB로 서비스가 이어집니다.
- **같은 이미지를 여러 환경에 배포한다** — 온프레미스(develop)와 AWS(main)에 커밋 SHA로 태그한 같은 이미지를 배포하고, 매번 수동 작업을 자동화로 바꿉니다.
- **평소에는 mock, 필요할 때만 실제 AI** — 개발·테스트는 mock으로 하고, mock일 때는 화면에 "샘플 데이터" 띠를 띄워 가짜 뉴스로 오해하지 않게 합니다.

---

## Architecture

![아키텍처](./docs/images/architecture.png)

```
[운영: AWS, main]
사용자
  -> CloudFront -> S3 (React 정적 화면)
  -> ALB -> Spring Boot API (Kubernetes)
       -> RDS MySQL / ElastiCache Redis (캐시·대기열)
       -> 워커 -> 뉴스 RSS·검색 API, AI 서비스
  -> 응답

[개발: 온프레미스, develop]
VM 3대 kubeadm 클러스터
  -> Ingress(Nginx): / 화면, /api/* API
  -> API·워커·요약 갱신 배치·MySQL·Redis
  -> 백업 -> S3
```

| 영역 | 기술 |
|------|------|
| Frontend | React (SPA) |
| Backend | Spring Boot, Spring Actuator |
| Database | MySQL (온프렘: 클러스터 내 / AWS: RDS) |
| Cache · Queue | Redis (온프렘: 클러스터 내 / AWS: ElastiCache) |
| Infra | 온프레미스 VM kubeadm, AWS EC2 kubeadm, ALB, S3, CloudFront |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| 모니터링 | Prometheus, Grafana |
| 인증 | JWT (httpOnly 쿠키) |

---

## 주요 기능

| 기능 | 설명 | 로그인 필요 |
|------|------|------------|
| 홈 | 6개 분야 카드, 분야마다 주요 이슈 제목 3개 | X |
| 분야 페이지 | 이슈 목록, 제목을 누르면 요약·출처·원문 링크 펼침 | X |
| 질문하기 | 질문하면 관련 기사를 찾아 AI가 기사 근거로 답변 (하루 10회) | O |
| 질문 기록 | 보낸 질문과 결과를 자동 기록, 처리 중에 화면을 떠나도 이어서 확인 | O |
| 질문 저장 | 결과 화면의 별 버튼으로 저장, 마이페이지에서 모아보기 | O |

주요 화면: 홈 / 분야 페이지 / 질문 결과 / 마이페이지 — 자세한 구성은 Wiki > UI Screens 참고.
API 상세 경로와 요청/응답 구조는 Wiki > API Specification 을 따릅니다.

---

## Documentation

상세 설계·회의 기록은 **GitHub Wiki** 에서 관리합니다.

| 카테고리 | 문서 |
|----------|------|
| **Start Here** | 기획 배경 · User Flows · UI Screens |
| **Architecture** | System Architecture · ERD · API Specification |
| **Operations** | 배포 가이드 · 장애 시나리오 · 성능 테스트 · 회의록 · 트러블슈팅 |

---

## 범위 경계

**제공 범위 (목표):**

- 6개 분야 뉴스 요약 (30분 주기 갱신, 원문 링크 포함)
- 로그인 사용자의 뉴스 기반 질문·답변, 질문 기록·저장
- 온프레미스·AWS 두 환경 자동 배포, Terraform으로 운영 환경 재생성
- 롤백·백업 복구·부하 테스트 시나리오 검증

**현재 미제공:**

- 뉴스와 무관한 요청 — 코드 작성, 번역, 개념 설명, 잡담처럼 기사 없이 답하는 질문은 서비스 범위 밖이라 거절 안내로 응답

**배포 단계:** `dev` → **`demo` (현재)** → `prod` (미선언)

---

## 보안과 개인정보 경계

이 저장소는 공개 저장소입니다. 다음 정보를 절대 포함하지 않습니다.

- 인증·클라우드 비밀값, `.env` 실제 값, 인증서·키 파일 (AI·뉴스 API 키, DB 비밀번호는 Kubernetes Secret으로 주입)
- 실제 사용자 개인정보, 운영 DB 계정 정보
- 내부 인프라 식별자 및 서버 직접 접근 URL

비밀값이 실수로 커밋되면 GitHub이 push를 차단합니다. 이미 커밋된 경우 **즉시 해당 키를 폐기하고 재발급**하세요. 커밋을 되돌리는 것만으로는 이력에 남습니다.

---

## 로컬 실행

**사전 요구사항:** {{Node 20+, JDK 17, MySQL 8.0}}

**Backend**

```bash
cp backend/.env.example backend/.env
{{./gradlew bootRun}}
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

- backend: `http://localhost:8080`
- frontend: `http://localhost:3000`
- env 템플릿: `backend/.env.example`, `frontend/.env.example`

**검증**

```bash
{{./gradlew test}}
cd frontend && npm run build
```

---

## 기여 방법

- **규칙 요약** — [CONTRIBUTING.md](./CONTRIBUTING.md)
- **실행 방법 상세** — [협업 가이드](./docs/GUIDE.md)

## License

이 프로젝트는 [MIT License](./LICENSE) 를 따릅니다.
