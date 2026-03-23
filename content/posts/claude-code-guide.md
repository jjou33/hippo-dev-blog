---
title: Oh My Claude Code (OMC) 완벽 가이드
description: Claude Code를 위한 멀티 에이전트 오케스트레이션 플러그인 Oh My Claude Code(OMC)의 설치부터 핵심 기능, 실전 활용법까지 총정리합니다.
section: AI Tools
sectionIcon: "custom:sparkles"
category: Claude Code
categoryIcon: Terminal
subcategory: OMC 가이드
subcategoryIcon: Terminal
date: "2026-03-22"
author: 조현우
heroImage: /post-images/claude-omc.png
---

## Oh My Claude Code(OMC)란?

**Oh My Claude Code(이하 OMC)**는 Claude Code를 위한 **팀 중심 멀티 에이전트 오케스트레이션 레이어**입니다.

단일 AI가 혼자 작업하는 것을 넘어, **32개의 전문화된 AI 에이전트**가 역할을 나눠 협력하며 작업합니다. 분석가·설계자·실행자·검증자 등 각 전문 에이전트가 파이프라인을 이루어 복잡한 개발 작업을 자동으로 처리합니다.

특히 별도의 명령어를 외울 필요 없이 **자연어로 원하는 것을 설명하면** OMC가 알아서 적합한 에이전트에게 위임하고 결과를 조율합니다.

> **GitHub**: [github.com/Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)

---

## 사전 요구사항

| 항목            | 내용                                       |
| --------------- | ------------------------------------------ |
| Claude Code CLI | 설치 필수                                  |
| 구독 / API      | Claude Max·Pro 구독 또는 Anthropic API Key |
| tmux            | 멀티 에이전트 팀 기능 사용 시 필요         |

---

## 설치 방법

### 방법 1. Claude Code 플러그인 마켓플레이스 (권장)

Claude Code 세션 내에서 아래 커맨드를 순서대로 입력합니다.

```
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
/plugin install oh-my-claudecode
/setup
/omc-setup
```

### 방법 2. npm 전역 설치

```bash
npm i -g oh-my-claude-sisyphus@latest
```

> npm 패키지명은 `oh-my-claude-sisyphus`이지만 동일한 OMC 도구입니다.

### 설치 후 초기 세팅

```
# 전역(Global) 설정
/oh-my-claudecode:omc-setup

# 프로젝트 단위 설정
/oh-my-claudecode:omc-setup --local
```

---

## 실행 모드 (Execution Modes)

OMC의 핵심은 상황에 맞는 다양한 실행 모드입니다.

### Team 모드 (권장)

여러 에이전트가 **단계별 파이프라인**으로 협력하는 기본 모드입니다.

```
/team 기능 구현 설명...
```

또는 자연어로:

```
team: 로그인 기능을 JWT 기반으로 구현해줘
```

### Autopilot 모드

**개념 → 완성**까지 7단계를 완전 자율 실행합니다.

```
분석 → 설계 → 계획 → 실행 → 테스트 → 검증 → 완료
```

```
/autopilot 결제 모듈을 Stripe 연동으로 처음부터 만들어줘
```

자연어 트리거:

```
autopilot: 대시보드 페이지를 처음부터 끝까지 만들어줘
```

### Ralph 모드

작업이 **검증될 때까지 멈추지 않는** 끈질긴 실행 모드입니다. 수정 사이클을 자동으로 반복합니다.

```
ralph: 모든 테스트가 통과될 때까지 버그를 고쳐줘
```

### Ultrapilot 모드

최대 **5개의 병렬 워커**로 동시 실행합니다. 순차 실행 대비 3~5배 빠릅니다.

```
/ultrapilot 여러 모듈을 동시에 개발해줘
```

### Swarm 모드

N개의 에이전트가 **공유 작업 풀**에서 협력하며 처리합니다.

```
/swarm 대규모 리팩터링 작업
```

---

## 32개 전문 에이전트

OMC는 역할별로 전문화된 에이전트를 자동으로 배치합니다.

### 빌드 & 분석

| 에이전트        | 역할                          |
| --------------- | ----------------------------- |
| `architect`     | 전체 시스템 설계 및 구조 결정 |
| `analyst`       | 요구사항 분석 및 문제 파악    |
| `planner`       | 실행 계획 수립                |
| `executor`      | 실제 코드 작성 및 구현        |
| `debugger`      | 버그 탐지 및 수정             |
| `verifier`      | 결과물 검증                   |
| `deep-executor` | 복잡한 구현 심층 처리         |
| `explorer`      | 코드베이스 탐색 및 분석       |

### 리뷰

| 에이전트            | 역할             |
| ------------------- | ---------------- |
| `code-reviewer`     | 코드 품질 리뷰   |
| `security-reviewer` | 보안 취약점 검토 |

### 도메인 전문가

| 에이전트          | 역할                |
| ----------------- | ------------------- |
| `test-engineer`   | 테스트 코드 작성    |
| `build-fixer`     | 빌드 오류 수정      |
| `designer`        | UI/UX 설계          |
| `writer`          | 문서 작성           |
| `qa-tester`       | QA 테스트 수행      |
| `git-master`      | git 작업 처리       |
| `code-simplifier` | 코드 단순화 및 정리 |

---

## 주요 슬래시 커맨드

### 핵심 자동화

| 커맨드            | 설명                                      |
| ----------------- | ----------------------------------------- |
| `/autopilot`      | 개념부터 완성까지 완전 자율 실행          |
| `/ralph`          | 검증 완료까지 반복 실행                   |
| `/team`           | 멀티 에이전트 오케스트레이션              |
| `/ralplan`        | 합의에 도달할 때까지 반복 계획            |
| `/deep-interview` | 코딩 전 소크라테스식 질문으로 사고 명확화 |

### AI 모델 연동

| 커맨드        | 설명                                   |
| ------------- | -------------------------------------- |
| `/ask-codex`  | OpenAI Codex에 쿼리                    |
| `/ask-gemini` | Google Gemini에 쿼리                   |
| `/ccg`        | Codex + Gemini + Claude 삼중 합성 응답 |

---

## CLI 커맨드

터미널에서 직접 실행하는 OMC CLI 명령어입니다.

```bash
# AI 쿼리
omc ask claude "리팩터링 방법 알려줘"
omc ask codex "이 함수 최적화해줘"
omc ask gemini "아키텍처 조언 부탁해"

# 팀 오케스트레이션
omc team 3:executor "결제 모듈 구현"
omc team 2:codex "API 엔드포인트 작성"

# 팀 상태 확인
omc team status [task-id]
omc team shutdown [task-id]

# 세션 검색
omc session search "이전에 논의한 인증 구현"
omc session search --project all --json
```

---

## 스마트 최적화

### 자동 모델 라우팅

작업 복잡도에 따라 자동으로 모델을 선택합니다.

- **단순 작업** → Claude Haiku (저렴하고 빠름)
- **복잡한 추론** → Claude Opus (높은 성능)

이 덕분에 **토큰 비용을 30~50% 절감**할 수 있습니다.

### 실시간 HUD 상태바

오케스트레이션 진행 상황을 실시간으로 표시합니다.

```
[OMC] Team: 3/5 agents ● Executor(running) Verifier(waiting) | Cost: $0.12
```

---

## 환경변수 설정

```bash
# 워크트리 간 공유 상태 디렉터리
export OMC_STATE_DIR="/path/to/shared-state"

# 병렬 실행 활성화 (기본값: true)
export OMC_PARALLEL_EXECUTION=true

# Language Server 타임아웃 (기본값: 15000ms)
export OMC_LSP_TIMEOUT_MS=15000

# OMC 전체 비활성화
export DISABLE_OMC=true

# 특정 훅만 건너뛰기
export OMC_SKIP_HOOKS="hook1,hook2"
```

---

## 실전 활용 예시

### 기능 전체 구현 (Autopilot)

```
autopilot: 사용자 인증 시스템을 JWT + Refresh Token 방식으로
           회원가입, 로그인, 로그아웃, 비밀번호 재설정까지 구현해줘
```

→ 분석 → 설계 → 구현 → 테스트 → 검증 자동 진행

### 버그 수정 (Ralph)

```
ralph: 프로덕션에서 간헐적으로 발생하는 메모리 누수를 찾아서
       모든 테스트가 통과할 때까지 고쳐줘
```

→ 수정이 완료되고 검증될 때까지 자동 반복

### 멀티 모델 의견 수렴 (CCG)

```
/ccg 이 마이크로서비스 아키텍처의 장단점을 분석해줘
```

→ Claude + Codex + Gemini 3개 모델의 관점을 종합해서 응답

### 대규모 병렬 개발 (Ultrapilot)

```
/ultrapilot 프론트엔드 컴포넌트 5개를 동시에 개발해줘:
- UserProfile
- Dashboard
- NotificationCenter
- Settings
- Analytics
```

→ 5개 워커가 병렬로 작업, 3~5배 빠른 완성

---

## OMC vs 일반 Claude Code

| 항목        | Claude Code | OMC                     |
| ----------- | ----------- | ----------------------- |
| 에이전트 수 | 1개         | 최대 32개               |
| 실행 방식   | 순차        | 병렬 / 파이프라인       |
| 자율성      | 반자율      | 완전 자율 (Autopilot)   |
| 토큰 최적화 | 없음        | 자동 모델 라우팅        |
| 멀티 모델   | Claude만    | Claude + Codex + Gemini |
| 작업 검증   | 수동        | 자동 (Ralph 모드)       |

---

## 마치며

Oh My Claude Code는 Claude Code를 **단순 AI 어시스턴트에서 자율 개발 팀**으로 업그레이드해줍니다.

복잡한 명령어 없이 자연어로 요청하면 OMC가 적합한 에이전트를 선택해 파이프라인을 구성하고, 분석부터 검증까지 스스로 처리합니다. 특히 `Autopilot`과 `Ralph` 모드는 단순 반복 작업에서 개발자를 해방시켜주는 강력한 기능입니다.

> **공식 문서**: [ohmyclaudecode.com](https://ohmyclaudecode.com/)
> **GitHub**: [github.com/Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)
