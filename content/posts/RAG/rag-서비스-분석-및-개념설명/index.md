---
title: RAG 서비스 분석 및 개념설명
description: RAG 서비스 에 대한 코드분석과 설계에 대한 아키텍처 정보 개념 설명
section: AI
sectionIcon: AndroidOs
category: 코드 및 분석 설명
categoryIcon: Code2
subcategory: RAG
subcategoryIcon: BookOpen
tags:
  - RAG
  - ToolCalling
  - LangGraph
  - LangChain
  - FastAPI
date: '2026-03-27'
author: 조현우
heroImage: >-
  https://raw.githubusercontent.com/jjou33/hippo-dev-blog/main/content/posts/RAG/rag-%EC%84%9C%EB%B9%84%EC%8A%A4-%EB%B6%84%EC%84%9D-%EB%B0%8F-%EA%B0%9C%EB%85%90%EC%84%A4%EB%AA%85/thumbnail.png
adminOnly: true
---
# LLM 챗봇 서버 완전 가이드

> 초보자도 이해할 수 있도록 아키텍처부터 코드 흐름까지 상세하게 설명합니다.

---

## 목차

1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [핵심 기술 개념](#2-핵심-기술-개념)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [코드별 상세 설명](#4-코드별-상세-설명)
5. [실제 코드 흐름 — 채팅 요청](#5-실제-코드-흐름--채팅-요청)
6. [실제 코드 흐름 — 문서 업로드](#6-실제-코드-흐름--문서-업로드)
7. [실제 코드 흐름 — Tool Calling & UI Form](#7-실제-코드-흐름--tool-calling--ui-form)
8. [환경 설정](#8-환경-설정)

---

## 1. 전체 아키텍처 개요

### 이 서버가 하는 일

```
사용자 (Vue3 프론트엔드)
        │  채팅 메시지 전송
        ▼
┌─────────────────────────────┐
│   FastAPI Python 서버        │  ← 이 프로젝트
│                             │
│  ① 질문 분류 (rag/general)   │
│  ② 문서 검색 (RAG)           │
│  ③ AI 응답 생성              │
│  ④ Spring API 호출 (Tool)   │
└─────────────┬───────────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
 Azure      Azure    Spring
 OpenAI    Search    Java
 (GPT-4o)  (벡터DB)  (백엔드)
```

### 전체 시스템 구성도

```
┌──────────────────────────────────────────────────────────────┐
│                        클라이언트                             │
│              Vue3 프론트엔드 (채팅 UI)                        │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP / SSE (Server-Sent Events)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   FastAPI 서버 (Python)                       │
│                                                              │
│  ┌──────────┐  ┌──────────────────────────────────────────┐  │
│  │ 라우터    │  │            LangGraph 상태머신             │  │
│  │ /chat    │→ │                                          │  │
│  │ /chat    │  │  START → router → retrieve → agent_chat  │  │
│  │ /stream  │  │                 ↘ direct_chat             │  │
│  │          │  │  tool_executor ←→ agent_chat (루프)       │  │
│  └──────────┘  └──────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ 문서 API  │  │  Spring 클라  │  │  PDF 프로세서           │  │
│  │/documents│  │  이언트      │  │  (추출/청킹/임베딩)      │  │
│  └──────────┘  └──────────────┘  └────────────────────────┘  │
└───────┬──────────────┬───────────────────────┬───────────────┘
        │              │                       │
        ▼              ▼                       ▼
┌──────────────┐ ┌──────────────┐   ┌──────────────────────┐
│ Azure OpenAI │ │ Azure AI     │   │   Spring Java 서버    │
│  (GPT-4o)   │ │ Search       │   │   (비즈니스 로직)      │
│  LLM 추론   │ │  (벡터 DB)   │   │   룰 생성/조회 등     │
└──────────────┘ └──────────────┘   └──────────────────────┘
```

---

## 2. 핵심 기술 개념

### 2-1. RAG (Retrieval-Augmented Generation)

**RAG란?** LLM(언어 모델)이 모르는 회사 내부 문서를 참고해서 답변하게 만드는 기술입니다.

```
일반 LLM의 문제:
  사용자: "우리 회사 보안 정책이 뭐야?"
  GPT:   "저는 해당 정보를 알 수 없습니다." ← 모름

RAG를 적용하면:
  ① 보안 정책 PDF를 미리 업로드해서 DB에 저장
  ② 사용자 질문이 들어오면 관련 내용을 DB에서 검색
  ③ 검색된 내용 + 질문을 함께 GPT에 전달
  ④ GPT가 문서를 보고 답변 → 정확한 답변 가능!
```

**RAG 파이프라인 (문서 업로드 시)**:
```
PDF 파일
   │
   ▼ 텍스트 추출 (pypdf)
"1페이지: 보안 정책은..."
"2페이지: 개인정보는..."
   │
   ▼ 청킹 (RecursiveCharacterTextSplitter)
chunk1: "보안 정책은 ..." (1000자)
chunk2: "개인정보는 ..." (1000자)
   │
   ▼ 임베딩 (text-embedding-3-small)
chunk1 → [0.123, -0.456, 0.789, ...] (숫자 벡터 1536개)
chunk2 → [0.234, -0.567, 0.890, ...]
   │
   ▼ 저장 (Azure AI Search)
벡터 DB에 저장 완료!
```

**RAG 파이프라인 (질문 시)**:
```
사용자: "보안 정책 알려줘"
   │
   ▼ 질문도 임베딩
"보안 정책 알려줘" → [0.120, -0.450, 0.780, ...]
   │
   ▼ 유사도 검색 (벡터 DB)
가장 비슷한 chunk 5개 찾기
   │
   ▼ GPT에 전달
System: "다음 문서를 참고해서 답변하세요: [chunk1][chunk2]..."
User:   "보안 정책 알려줘"
   │
   ▼ GPT 응답
"회사 보안 정책에 따르면..."
```

### 2-2. LangGraph (상태 머신)

**LangGraph란?** 챗봇의 대화 흐름을 그래프(노드 + 엣지) 형태로 정의하는 프레임워크입니다.

```
그래프 = 노드(처리 단계) + 엣지(이동 경로)

    [START]
       │
       ▼
   [router]  ← 질문 분류 노드
    /    \
 rag    general
  │        │
  ▼        ▼
[retrieve] [direct_chat] ← 일반 대화 노드
  │
  ▼
[agent_chat] ← RAG + Tool 대화 노드
  │  ↑
  │  │ (tool 호출이 있으면 루프)
  ▼  │
[tool_executor] ← Tool 실행 노드
  │
  ▼
 [END]
```

**왜 상태머신을 쓰나?**
- 대화 히스토리 자동 관리 (thread_id로 구분)
- 노드 간 상태(state) 공유
- 조건부 분기 처리 (if-else 없이 그래프로 표현)

### 2-3. Tool Calling

**Tool Calling이란?** GPT가 직접 외부 API를 호출하게 하는 기능입니다.

```
기존 방식:
  사용자: "룰 생성해줘"
  GPT:   "어떤 이름으로 만들까요?" ← 텍스트로 물어봄
  사용자: "급여규칙"
  GPT:   "폴더는요?" ← 또 물어봄
  ...반복...

Tool Calling 방식:
  사용자: "룰 생성해줘"
  GPT:   request_rule_input() 함수 호출! ← 도구를 직접 사용
  서버:  UI 폼 이벤트를 프론트엔드로 전송
  사용자: UI 폼에서 한 번에 입력
  GPT:   create_rule(name="급여규칙", ...) 함수 호출!
  서버:  Spring API 호출로 실제 생성 완료
```

### 2-4. SSE (Server-Sent Events)

**SSE란?** 서버에서 클라이언트로 실시간으로 데이터를 스트리밍하는 기술입니다.

```
일반 HTTP:
  클라이언트 → [요청] → 서버
  클라이언트 ← [전체 응답] ← 서버 (다 완성되면 한 번에)

SSE (스트리밍):
  클라이언트 → [요청] → 서버
  클라이언트 ← "안" ← 서버
  클라이언트 ← "녕" ← 서버
  클라이언트 ← "하" ← 서버
  클라이언트 ← "세" ← 서버
  클라이언트 ← "요" ← 서버  (글자가 하나씩 실시간 전송)
```

**이 프로젝트의 SSE 이벤트 종류**:
```
event: message  data: {"stage": "routing"}      ← 질문 분류 중
event: message  data: {"stage": "searching"}    ← 문서 검색 중
event: message  data: {"stage": "calling_api"}  ← API 호출 중
event: message  data: {"stage": "generating"}   ← 답변 생성 중
event: message  data: {"content": "안녕", "thread_id": "..."} ← 응답 청크
event: ui_request data: {"ui_request": {...}}   ← UI 폼 요청
event: done     data: {"thread_id": "..."}      ← 완료
event: error    data: {"error": "..."}          ← 오류
```

### 2-5. 임베딩 (Embedding)

**임베딩이란?** 텍스트를 숫자 벡터로 변환하는 기술입니다. 의미가 비슷한 텍스트는 벡터도 비슷해집니다.

```
"강아지"  → [0.1, 0.8, 0.3, ...]
"개"      → [0.1, 0.7, 0.3, ...]  ← 강아지랑 비슷!
"자동차"  → [0.9, 0.1, 0.7, ...]  ← 강아지랑 다름

유사도 검색: 질문 벡터와 가장 가까운 문서 벡터를 찾음
```

### 2-6. HNSW (Hierarchical Navigable Small World)

**HNSW란?** 벡터 유사도 검색을 빠르게 하는 알고리즘입니다. 수백만 개의 벡터 중에서 가장 유사한 것을 빠르게 찾아줍니다.

```
브루트포스 검색: 모든 벡터와 하나씩 비교 → 느림 O(n)
HNSW:          계층적 그래프로 빠르게 탐색 → 빠름 O(log n)
```

---

## 3. 프로젝트 구조

```
hrag/
├── app/                        ← 애플리케이션 코드
│   ├── main.py                 ← FastAPI 앱 시작점
│   ├── config.py               ← 환경변수 설정 관리
│   │
│   ├── models/
│   │   └── schemas.py          ← 요청/응답 데이터 구조 정의
│   │
│   ├── routers/                ← API 엔드포인트
│   │   ├── chat.py             ← /chat, /chat/stream
│   │   └── document.py         ← /documents/upload, /index/reset
│   │
│   ├── services/               ← 핵심 비즈니스 로직
│   │   ├── azure_llm.py        ← Azure OpenAI LLM 연결
│   │   ├── azure_search.py     ← Azure AI Search (벡터DB) 연결
│   │   ├── pdf_processor.py    ← PDF → 청킹 → 임베딩 → 저장
│   │   ├── spring_client.py    ← Spring Java 서버 HTTP 클라이언트
│   │   └── chatbot_graph.py    ← LangGraph 챗봇 핵심 로직
│   │
│   └── tools/
│       └── spring_api_tools.py ← LLM이 호출할 수 있는 Tool 정의
│
├── docs/                       ← 문서
├── env.example                 ← 환경변수 예시
├── requirements.txt            ← Python 패키지 목록
└── gunicorn.conf.py            ← 프로덕션 서버 설정
```

---

## 4. 코드별 상세 설명

### 4-1. `app/config.py` — 환경변수 설정 관리

**역할**: `.env` 파일에서 설정을 읽어서 앱 전체에 제공합니다.

```python
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Azure OpenAI 설정
    azure_openai_endpoint: str = Field(default="")
    azure_openai_api_key: str = Field(default="")
    azure_openai_deployment_name: str = Field(default="gpt-4o")
    azure_openai_api_version: str = Field(default="2024-08-01-preview")

    # Azure AI Search 설정 (RAG용 벡터 DB)
    azure_search_endpoint: str = Field(default="")
    azure_search_api_key: str = Field(default="")
    azure_search_index_name: str = Field(default="pdf-rag-index")
    azure_search_verify_ssl: bool = Field(default=True)

    # 임베딩 모델
    azure_openai_embedding_deployment_name: str = Field(default="text-embedding-3-small")

    # Spring Java 서버 설정
    spring_base_url: str = Field(default="http://localhost:8080")
    spring_jwt_token: str = Field(default="")
    spring_request_timeout: float = Field(default=30.0)
    spring_verify_ssl: bool = Field(default=True)

    class Config:
        env_file = ".env"          # .env 파일 자동 로드
        case_sensitive = False     # 대소문자 무시 (AZURE_OPENAI_ENDPOINT = azure_openai_endpoint)

@lru_cache()               # ← 한 번만 생성, 이후엔 캐시에서 반환 (싱글톤)
def get_settings() -> Settings:
    return Settings()
```

#### `BaseSettings`란?

`pydantic_settings` 라이브러리에서 제공하는 클래스입니다. 일반 `BaseModel`과 비슷하지만, **환경변수를 자동으로 읽어서** 필드에 채워줍니다.

```
# .env 파일
AZURE_OPENAI_ENDPOINT=https://my-openai.azure.com/
AZURE_OPENAI_API_KEY=sk-abc123

# Python 코드
class Settings(BaseSettings):
    azure_openai_endpoint: str   # ← 자동으로 "https://my-openai.azure.com/" 로 채워짐!
    azure_openai_api_key: str    # ← 자동으로 "sk-abc123" 으로 채워짐!

동작 원리:
  1. 필드명 azure_openai_endpoint 을 대문자로 변환 → AZURE_OPENAI_ENDPOINT
  2. .env 파일 또는 시스템 환경변수에서 해당 이름으로 값을 찾음
  3. 값을 필드 타입(str, int, bool 등)에 맞게 자동 변환
```

**BaseModel vs BaseSettings 차이**:
```python
# BaseModel: JSON/dict에서 데이터를 받음 (API 요청/응답에 사용)
class ChatRequest(BaseModel):
    message: str  # ← 사용자가 보낸 JSON에서 읽음

# BaseSettings: 환경변수/.env에서 데이터를 받음 (서버 설정에 사용)
class Settings(BaseSettings):
    azure_openai_api_key: str  # ← .env 파일에서 읽음
```

#### `Field()`란?

필드에 대한 **추가 정보**(기본값, 설명, 유효성 검사 등)를 설정하는 함수입니다.

```python
# Field의 주요 매개변수:
azure_openai_endpoint: str = Field(
    default="",                    # 기본값 (.env에 없으면 이 값 사용)
    description="Azure OpenAI 엔드포인트 URL"  # 설명 (Swagger 문서에 표시)
)

# Field 없이 기본값만 설정 (더 단순하지만 설명이 없음):
azure_openai_endpoint: str = ""

# Field(...)은 "필수 항목":
message: str = Field(...)   # ← 값이 없으면 에러!
message: str = Field(default="")  # ← 값이 없으면 빈 문자열 사용
```

#### `class Config`란?

`BaseSettings`의 동작 방식을 설정하는 내부 클래스입니다.

```python
class Config:
    env_file = ".env"         # 어떤 파일에서 환경변수를 읽을지
    env_file_encoding = "utf-8"  # 파일 인코딩
    case_sensitive = False    # 대소문자 구분 여부

# case_sensitive = False 이면:
#   .env: AZURE_OPENAI_ENDPOINT=...  (대문자)
#   코드: azure_openai_endpoint      (소문자)  ← 매칭됨!
```

#### `@lru_cache()` 설명

`functools` 모듈의 데코레이터입니다. 함수 결과를 캐시(메모리에 저장)해서, 같은 인자로 다시 호출하면 함수를 실행하지 않고 저장된 결과를 반환합니다.

```
첫 번째 호출: Settings() 객체 생성 + 캐시 저장  (느림: .env 파일 읽기)
두 번째 호출: 캐시에서 바로 반환               (빠름: 메모리에서 꺼냄)
세 번째 호출: 캐시에서 바로 반환
...
→ .env 파일을 딱 한 번만 읽음 (성능 최적화)
→ 앱 전체에서 같은 Settings 객체를 공유 = "싱글톤 패턴"
```

**싱글톤 패턴이란?**
```
객체를 딱 하나만 만들어서 모든 곳에서 공유하는 패턴

안 쓰면: get_settings() 호출할 때마다 .env 파일을 읽고 새 객체 생성 (낭비)
쓰면:   처음 한 번만 만들고, 이후엔 같은 객체 재사용 (효율적)
```

---

### 4-2. `app/main.py` — FastAPI 앱 시작점

**역할**: FastAPI 앱을 생성하고 미들웨어, 라우터를 등록합니다.

#### FastAPI란?

Python 웹 프레임워크입니다. Spring Boot(Java)처럼 API 서버를 만드는 도구인데, Python의 **타입 힌트**와 **async/await**를 적극 활용해 빠르고 간결합니다.

```
비교:
  Spring Boot (Java): @RestController + @GetMapping
  FastAPI (Python):    @app.get()

FastAPI의 특징:
  - 자동 API 문서 생성 (/docs에서 Swagger UI 제공)
  - Pydantic 기반 자동 검증
  - async/await 지원 (비동기 처리)
  - 타입 힌트 기반으로 코드 작성
```

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 실행
    settings = get_settings()
    print("🚀 LLM Chatbot Server starting...")

    yield  # ← 서버 실행 중 (여기서 요청을 처리)

    # 서버 종료 시 실행
    print("👋 LLM Chatbot Server shutting down...")

app = FastAPI(title="LLM Chatbot Server", lifespan=lifespan)

# CORS 설정: 모든 도메인에서 API 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 프로덕션에선 특정 도메인만 허용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router, prefix="/api/v1")      # /api/v1/chat
app.include_router(document.router, prefix="/api/v1")  # /api/v1/documents
```

#### `@asynccontextmanager`와 `lifespan`이란?

**lifespan**은 서버의 "생명주기"를 관리하는 함수입니다. 서버가 켜질 때/꺼질 때 실행할 코드를 정의합니다.

```
서버 시작 (uvicorn 실행)
    │
    ▼ lifespan() 실행 — yield 이전 코드
    "🚀 LLM Chatbot Server starting..."

    ▼ yield ← 여기서 멈춤 (서버가 실행 중인 동안)
    [요청 처리, 요청 처리, 요청 처리...]

    ▼ 서버 종료 시 — yield 이후 코드
    "👋 LLM Chatbot Server shutting down..."
```

**`@asynccontextmanager`**는 이 "시작 → 실행 중 → 종료" 패턴을 만들어주는 데코레이터입니다. `yield`를 기준으로 앞은 시작 코드, 뒤는 종료 코드가 됩니다.

#### `app.add_middleware()`란?

**미들웨어**는 모든 요청/응답이 지나가는 "관문"입니다. 요청이 라우터에 도달하기 전과 응답이 클라이언트에 전달되기 전에 실행됩니다.

```
클라이언트 → [CORS 미들웨어] → [라우터] → [비즈니스 로직]
          ← [CORS 미들웨어] ←          ← [응답 생성]

미들웨어가 하는 일:
  요청 시: "이 요청의 출처(Origin)가 허용된 도메인인지 확인"
  응답 시: "Access-Control-Allow-Origin 헤더 추가"
```

#### `app.include_router()`란?

라우터(엔드포인트 묶음)를 앱에 등록하는 함수입니다.

```python
# chat.py에서 정의된 라우터:
router = APIRouter(prefix="/chat")  # 이미 /chat이 prefix

# main.py에서 등록:
app.include_router(chat.router, prefix="/api/v1")

# 최종 경로: /api/v1 + /chat + "" = /api/v1/chat
#           /api/v1 + /chat + /stream = /api/v1/chat/stream
```

#### CORS란?

**CORS (Cross-Origin Resource Sharing)** = 다른 출처(도메인)간 자원 공유를 허용하는 보안 메커니즘입니다.

```
브라우저 보안 정책: 다른 도메인 서버로 요청 차단
예시: http://frontend.com → http://api.com 요청 → 브라우저가 차단!

CORS 설정으로 허용:
서버: "나는 모든 도메인(*)에서 오는 요청을 허용해"
브라우저: "OK, 통과시켜줄게"

주의: allow_origins=["*"]는 개발 편의용.
프로덕션에선 allow_origins=["https://your-frontend.com"] 처럼 특정 도메인만 허용해야 안전합니다.
```

---

### 4-3. `app/models/schemas.py` — 데이터 구조 정의

**역할**: API 요청/응답의 데이터 형식을 Pydantic으로 정의합니다.

#### Pydantic이란?

Python의 **데이터 검증 라이브러리**입니다. JSON 데이터를 Python 객체로 변환하면서 자동으로 타입 검사, 변환, 에러 처리를 해줍니다. Java의 DTO(Data Transfer Object) + Bean Validation과 비슷합니다.

#### `BaseModel`이란?

Pydantic의 핵심 클래스입니다. 이 클래스를 상속받으면 **자동 데이터 검증** 기능을 가진 데이터 클래스가 됩니다.

```python
from typing import Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    """채팅 요청 형식"""
    message: str = Field(..., description="사용자 메시지")
    thread_id: Optional[str] = Field(default=None, description="대화 스레드 ID")
    stream: bool = Field(default=False, description="스트리밍 여부")

class ChatResponse(BaseModel):
    """채팅 응답 형식"""
    message: str              # AI 응답 텍스트
    thread_id: str            # 대화 ID (다음 메시지에 사용)
    ui_request: Optional[dict]  # UI 폼 요청 (있을 때만)
```

#### `Field(...)`와 `Field(default=...)` 차이

```python
# Field(...)  → 필수 항목. 값이 없으면 422 에러!
message: str = Field(..., description="사용자 메시지")
# "..." 는 Pydantic의 특수 값으로 "이 필드는 반드시 있어야 함"을 의미

# Field(default=None)  → 선택 항목. 없으면 None 사용
thread_id: Optional[str] = Field(default=None)

# Field(default=False) → 선택 항목. 없으면 False 사용
stream: bool = Field(default=False)
```

#### `Optional[str]`이란?

`str` 또는 `None`이 될 수 있다는 타입 힌트입니다.

```python
thread_id: Optional[str]
# thread_id = "abc-123"  ← OK (str)
# thread_id = None       ← OK (None)
# thread_id = 123        ← 에러! (int는 안됨)
```

#### `response_model`과 `BaseModel`의 관계

FastAPI 라우터에서 `response_model=ChatResponse`로 지정하면, 응답 데이터를 자동으로 ChatResponse 형식에 맞게 변환하고 검증합니다.

```python
@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    # request: JSON → ChatRequest 자동 변환 (입력 검증)
    # return:  ChatResponse → JSON 자동 변환 (출력 검증)
    return ChatResponse(message="안녕", thread_id="abc", ui_request=None)
```

#### Pydantic 자동 검증 예시

```
요청 데이터 자동 검증 & 변환:
{
  "message": "안녕",   ← OK (str 타입 맞음)
  "stream": "yes"      ← "yes"는 bool이 아님! → Pydantic이 에러 반환
}

{
  "message": "안녕",
  "stream": true       ← OK
  "thread_id": null    ← OK (Optional이므로 null 허용)
}

필수 항목 누락 시:
{
  "stream": true       ← message 없음! → 422 Validation Error
}
```

---

### 4-4. `app/routers/chat.py` — 채팅 API 엔드포인트

**역할**: HTTP 요청을 받아서 챗봇 서비스를 호출하고 응답을 반환합니다.

#### `APIRouter`란?

FastAPI에서 엔드포인트를 그룹별로 묶어 관리하는 객체입니다. Spring의 `@RequestMapping` 클래스와 비슷합니다.

```python
router = APIRouter(prefix="/chat", tags=["Chat"])
# prefix="/chat": 이 라우터의 모든 엔드포인트 앞에 /chat 이 붙음
# tags=["Chat"]:  Swagger 문서에서 "Chat" 그룹으로 묶여 표시됨

@router.post("")           # POST /chat
@router.post("/stream")   # POST /chat/stream
```

#### `@router.post()` 데코레이터란?

HTTP POST 요청을 처리하는 엔드포인트를 정의합니다.

```python
@router.post(
    "",                             # 경로: /chat (prefix와 합쳐짐)
    response_model=ChatResponse,    # 응답 형식 지정 (자동 검증 + Swagger 문서)
    summary="채팅 메시지 전송",       # Swagger 문서에 표시되는 요약
    description="사용자 메시지를..."   # Swagger 문서에 표시되는 설명
)
async def send_message(request: ChatRequest, raw: Request):
    # request: ChatRequest → JSON body를 Pydantic 모델로 자동 변환
    # raw: Request         → FastAPI의 원본 요청 객체 (헤더 접근용)
    ...
```

#### `async def`란?

Python의 **비동기 함수** 선언입니다. `await` 키워드로 I/O 작업(네트워크, DB 등)을 기다리는 동안 다른 요청을 처리할 수 있습니다.

```
동기 (def):
  요청A 처리 시작 → [DB 대기 3초] → 응답A    (3초 동안 다른 요청 못 받음!)
  요청B 처리 시작 → [DB 대기 3초] → 응답B
  총 6초

비동기 (async def):
  요청A 처리 시작 → [DB 대기 (await)]
  요청B 처리 시작 → [DB 대기 (await)]  ← A가 대기 중일 때 B 처리 시작!
  요청A DB 완료 → 응답A
  요청B DB 완료 → 응답B
  총 ~3초
```

#### `EventSourceResponse`란?

`sse-starlette` 라이브러리에서 제공하는 SSE 응답 객체입니다. 일반 HTTP 응답과 달리 연결을 유지하면서 데이터를 계속 보낼 수 있습니다.

```python
return EventSourceResponse(generate_stream(message, thread_id))
# generate_stream = async generator (yield로 데이터를 하나씩 내보냄)
# EventSourceResponse가 yield된 데이터를 SSE 형식으로 변환해서 클라이언트에 전송
```

#### 요청 컨텍스트 설정

```python
from app.services.spring_client import (
    request_bearer_token,  # ContextVar: 현재 요청의 JWT 토큰
    request_w1ne_role,     # ContextVar: 사용자 역할
    request_w1ne_type,     # ContextVar: 사용자 타입
)

def _set_request_context(raw: Request) -> None:
    """헤더에서 인증 정보를 꺼내 ContextVar에 저장"""
    auth = raw.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        request_bearer_token.set(auth[7:])  # "Bearer " 이후 토큰만 저장

    request_w1ne_role.set(raw.headers.get("w1ne-role", ""))
    request_w1ne_type.set(raw.headers.get("w1ne-type", ""))
```

**ContextVar란?**
```
문제: 여러 사용자가 동시에 요청을 보낼 때
     전역 변수에 토큰을 저장하면 서로 섞임!

해결: ContextVar = 요청(coroutine)별로 독립된 변수 공간
     사용자A 요청 → ContextVar에 TokenA 저장
     사용자B 요청 → ContextVar에 TokenB 저장 (A의 토큰에 영향 없음)

     나중에 Spring API 호출할 때 ContextVar에서 자동으로 꺼냄
```

#### `async for`와 `yield`란?

```python
# yield = 값을 하나씩 "내보내는" 키워드 (return과 다르게 함수가 끝나지 않음)
async def generate_stream(...):
    yield {"event": "message", "data": "routing"}  # ← 첫 번째 값 전송
    # 함수가 여기서 일시 정지, 클라이언트가 받으면 다시 실행
    yield {"event": "message", "data": "searching"}  # ← 두 번째 값 전송
    # 또 일시 정지...

# async for = 비동기 제너레이터에서 값을 하나씩 꺼냄
async for item in chat_stream(message, thread_id):
    # chat_stream이 yield할 때마다 item에 값이 들어옴
    # 모든 yield가 끝나면 for 루프 종료
```

#### 스트리밍 응답 생성기

```python
async def generate_stream(message: str, thread_id: str | None):
    async for item in chat_stream(message, thread_id):

        if "stage" in item:
            # stage 알림: {"stage": "routing"}
            yield {
                "event": "message",
                "data": json.dumps({"stage": item["stage"]})
            }

        elif "ui_request" in item:
            # UI 폼 요청: {"ui_request": {...}, "thread_id": "..."}
            yield {
                "event": "ui_request",
                "data": json.dumps({"ui_request": item["ui_request"], "thread_id": tid})
            }

        elif "content" in item:
            # 응답 텍스트 청크: {"content": "안녕", "thread_id": "..."}
            yield {
                "event": "message",
                "data": json.dumps({"content": item["content"], "thread_id": tid})
            }

    # 스트림 완료
    yield {
        "event": "done",
        "data": json.dumps({"thread_id": current_thread_id})
    }
```

---

### 4-5. `app/services/azure_llm.py` — LLM 연결

**역할**: Azure OpenAI의 GPT-4o 모델 인스턴스를 생성합니다.

#### `AzureChatOpenAI`란?

LangChain 라이브러리에서 제공하는 클래스로, Azure에 배포된 OpenAI 모델(GPT-4o 등)을 Python에서 호출할 수 있게 해줍니다. 직접 REST API를 호출하지 않아도 되므로 편리합니다.

```python
# 직접 REST API 호출 (복잡):
response = await httpx.post(
    "https://my-openai.azure.com/openai/deployments/gpt-4o/chat/completions",
    headers={"api-key": "..."},
    json={"messages": [{"role": "user", "content": "안녕"}]}
)

# AzureChatOpenAI 사용 (간단):
model = AzureChatOpenAI(azure_endpoint="...", api_key="...")
response = await model.ainvoke([HumanMessage("안녕")])
```

#### `BaseChatModel`이란?

LangChain에서 모든 채팅 모델의 **부모 클래스**(인터페이스)입니다. `AzureChatOpenAI`, `ChatOpenAI`, `ChatAnthropic` 등이 모두 이 클래스를 상속합니다. 반환 타입을 `BaseChatModel`로 지정하면 나중에 다른 LLM으로 교체하기 쉽습니다.

```python
from langchain_core.language_models import BaseChatModel
from langchain_openai import AzureChatOpenAI

def get_azure_chat_model() -> BaseChatModel:  # ← 반환 타입을 인터페이스로 지정
    settings = get_settings()
    return AzureChatOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        azure_deployment=settings.azure_openai_deployment_name,  # "gpt-4o"
        api_version=settings.azure_openai_api_version,
        temperature=0.7,     # 창의성 (0=정확, 1=창의적)
        streaming=True,      # 글자 단위 스트리밍 활성화
    )
```

#### `temperature` 설명

LLM이 응답을 생성할 때 얼마나 "창의적"일지 결정하는 파라미터입니다.

```
temperature=0.0: 항상 같은 답변, 가장 확률 높은 단어만 선택 (수학/코드에 적합)
temperature=0.7: 약간의 창의성, 때때로 다른 단어 선택 (일반 대화에 적합)
temperature=1.0: 매우 창의적, 낮은 확률의 단어도 선택 (창작에 적합)

예시 (다음 단어 예측: "오늘 날씨가 ___"):
  temp=0: "좋습니다" (항상)
  temp=0.7: "좋습니다" / "맑습니다" / "화창합니다" (매번 다를 수 있음)
  temp=1.0: "좋습니다" / "맑습니다" / "환상적입니다" / "미쳤습니다" (더 다양)
```

#### `streaming=True`의 의미

```
streaming=False:
  model.ainvoke("안녕") → (3초 대기) → "안녕하세요! 무엇을 도와드릴까요?" (한 번에)

streaming=True:
  model.ainvoke("안녕") → "안" → "녕" → "하세요" → "!" → ... (실시간)
  → 사용자가 글자가 타이핑되는 것처럼 볼 수 있음 (UX 향상)
```

#### 두 번째 함수: `get_azure_chat_model_with_identity()`

API 키 대신 **Azure AD 인증 (Managed Identity)**을 사용하는 버전입니다.

```python
def get_azure_chat_model_with_identity() -> BaseChatModel:
    from azure.identity import DefaultAzureCredential
    credential = DefaultAzureCredential()  # Azure에서 자동으로 인증 정보 획득

    return AzureChatOpenAI(
        azure_ad_token_provider=lambda: credential.get_token(...).token,
        # ↑ API 키 대신 Azure AD 토큰을 사용
        ...
    )
```

```
API 키 방식:      코드에 키를 저장 → 유출 위험!
Managed Identity: Azure가 자동 인증 → 키 없이도 동작 (프로덕션 권장)
```

---

### 4-6. `app/services/azure_search.py` — 벡터 DB 연결

**역할**: Azure AI Search에 문서를 저장하고 유사도 검색을 수행합니다.

#### `@dataclass`란?

Python의 데이터 저장용 클래스를 간단하게 만드는 데코레이터입니다. `__init__`, `__repr__` 등을 자동 생성해줍니다.

```python
from dataclasses import dataclass

@dataclass(frozen=True)  # frozen=True → 생성 후 값 변경 불가 (불변 객체)
class SearchChunk:
    id: str
    content: str
    filename: str | None = None       # 선택 필드 (없으면 None)
    page_number: int | None = None
    score: float | None = None

# 사용:
chunk = SearchChunk(id="uuid-001", content="보안 정책은...")
print(chunk.content)  # "보안 정책은..."
chunk.content = "수정"  # 에러! (frozen=True이므로 수정 불가)
```

**Pydantic `BaseModel` vs `dataclass` 차이**:
```
BaseModel:  JSON 변환 + 자동 검증 (API 요청/응답에 적합)
dataclass:  단순 데이터 저장 (내부 로직에서 사용, 더 가벼움)
```

#### `SearchIndexClient` vs `SearchClient` 차이

```
SearchIndexClient: 인덱스 자체를 관리 (생성, 삭제, 스키마 변경)
  → "테이블 만들기/삭제하기" (DDL)

SearchClient:      인덱스 안의 문서를 관리 (삽입, 검색, 삭제)
  → "데이터 넣기/조회하기" (DML)
```

#### 인덱스 스키마

**인덱스란?** DB의 테이블과 비슷한 개념입니다. 어떤 필드(컬럼)가 있고, 각 필드의 타입과 용도를 정의합니다.

```python
def _build_index(index_name: str, vector_dimensions: int) -> SearchIndex:
    fields = [
        SimpleField(name="id", type=String, key=True),           # 고유 ID (Primary Key)
        SearchField(name="content", type=String, searchable=True),  # 텍스트 (전문 검색 가능)
        SimpleField(name="filename", type=String, filterable=True), # 파일명 (필터 가능)
        SimpleField(name="page_number", type=Int32),               # 페이지 번호
        SearchField(
            name="content_vector",
            type=Collection(Single),         # float 배열 (벡터)
            vector_search_dimensions=1536,   # text-embedding-3-small 기준
            vector_search_profile_name="content-vector-profile",
        ),
    ]
```

**`SimpleField` vs `SearchField` 차이**:
```
SimpleField: 저장만 하는 필드 (필터, 정렬에 사용)
  → SQL의 일반 컬럼 (WHERE filename = 'policy.pdf')

SearchField: 검색 가능한 필드 (전문 검색 또는 벡터 검색에 사용)
  → SQL의 FULLTEXT INDEX 컬럼
  → searchable=True: 키워드 검색 가능
  → vector_search_dimensions: 벡터 유사도 검색 가능
```

**인덱스 구조 시각화**:
```
Azure AI Search 인덱스 "pdf-rag-index"
┌────────────────────────────────────────────────────────────┐
│ id       │ content        │ filename    │ page │ vector    │
├──────────┼────────────────┼─────────────┼──────┼───────────┤
│ uuid-001 │ "보안 정책은.." │ policy.pdf  │  1   │ [0.1,...] │
│ uuid-002 │ "개인정보는.."  │ policy.pdf  │  2   │ [0.2,...] │
│ uuid-003 │ "채용 절차는.." │ hr.pdf      │  1   │ [0.5,...] │
└──────────┴────────────────┴─────────────┴──────┴───────────┘
```

#### `VectorSearch`와 `HnswAlgorithmConfiguration`

벡터 검색 방식을 설정합니다.

```python
vector_search = VectorSearch(
    algorithms=[HnswAlgorithmConfiguration(name="content-hnsw")],
    # HNSW 알고리즘 사용 (앞서 설명한 빠른 벡터 검색 알고리즘)

    profiles=[VectorSearchProfile(
        name="content-vector-profile",
        algorithm_configuration_name="content-hnsw",  # 위에서 정의한 알고리즘 사용
    )]
)
# profile = 필드와 알고리즘을 연결하는 설정
# content_vector 필드가 "content-vector-profile"을 사용 → HNSW 알고리즘 적용
```

#### 벡터 검색

```python
def vector_search(query_vector: list[float], top_k: int = 5) -> list[SearchChunk]:
    vector_query = VectorizedQuery(
        vector=query_vector,          # 질문 임베딩 벡터
        k_nearest_neighbors=top_k,   # 상위 5개 반환
        fields="content_vector",     # 검색할 벡터 필드
    )
    results = client.search(
        search_text="",              # 텍스트 검색 없음 (순수 벡터 검색)
        vector_queries=[vector_query],
        top=top_k
    )
```

**`VectorizedQuery`란?** 이미 임베딩된 벡터를 사용해서 검색하는 쿼리입니다.

```
사용자 질문 → 임베딩 → query_vector = [0.1, -0.3, ...]
이 벡터와 DB에 저장된 content_vector 를 비교
가장 가까운(유사한) k개 반환
```

---

### 4-7. `app/services/pdf_processor.py` — PDF 처리 파이프라인

**역할**: PDF를 읽어서 청킹 → 임베딩 → Azure Search에 저장합니다.

#### `PdfReader`란?

`pypdf` 라이브러리에서 제공하는 PDF 읽기 도구입니다. PDF 파일을 페이지별로 순회하며 텍스트를 추출합니다.

#### `io.BytesIO`란?

바이트 데이터(메모리)를 파일처럼 사용할 수 있게 해주는 래퍼입니다.

```python
# 일반적인 파일 읽기:
reader = PdfReader("document.pdf")  # ← 디스크에 있는 파일

# BytesIO 사용:
reader = PdfReader(io.BytesIO(file_bytes))  # ← 메모리에 있는 바이트를 파일처럼
# 업로드된 파일은 디스크에 저장하지 않고 메모리에서 바로 처리 (빠르고 효율적)
```

#### `RecursiveCharacterTextSplitter`란?

LangChain에서 제공하는 **텍스트 분할기**입니다. 긴 텍스트를 적절한 크기의 작은 조각(chunk)으로 나눕니다. "Recursive(재귀적)"이란, 문단 → 문장 → 단어 순으로 점점 작은 단위로 나누면서 최적의 분할 위치를 찾는다는 의미입니다.

```python
async def process_and_index_pdf(file_bytes: bytes, filename: str) -> int:

    # ① PDF 파싱
    reader = PdfReader(io.BytesIO(file_bytes))

    # ② 텍스트 추출 + 청킹
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,    # 청크 최대 크기 (문자 수)
        chunk_overlap=200,  # 청크 간 겹치는 부분 (문맥 유지)
    )

    for page_index, page in enumerate(reader.pages):
        page_text = page.extract_text()
        chunks = splitter.split_text(page_text)
        # 예: 3000자 페이지 → chunk1(0~1000자), chunk2(800~1800자), chunk3(1600~2600자)
        #                                          ↑200자 겹침              ↑200자 겹침

    # ③ 임베딩 생성
    embeddings = AzureOpenAIEmbeddings(...)
    vectors = embeddings.embed_documents(texts)  # 모든 청크를 한 번에 임베딩

    # ④ Azure Search에 저장
    documents = [
        {
            "id": str(uuid4()),           # 고유 ID 생성
            "content": text,
            "content_vector": vector,
            "filename": filename,
            "page_number": page_num,
        }
        for text, vector, meta in zip(texts, vectors, metadatas)
    ]
    upsert_chunks(documents)
    return len(documents)
```

#### `uuid4()`란?

전 세계적으로 고유한 ID를 생성하는 함수입니다. 같은 값이 나올 확률이 사실상 0입니다.

```python
from uuid import uuid4

print(uuid4())  # "550e8400-e29b-41d4-a716-446655440000"
print(uuid4())  # "6ba7b810-9dad-11d1-80b4-00c04fd430c8"  ← 매번 다른 값
# → 각 문서 청크의 고유 식별자로 사용
```

#### `zip()`이란?

여러 리스트를 병렬로 묶어서 순회하는 함수입니다.

```python
texts     = ["보안 정책은...", "개인정보는..."]
vectors   = [[0.1, -0.3],     [0.2, -0.1]]
metadatas = [{"page": 1},     {"page": 2}]

for text, vector, meta in zip(texts, vectors, metadatas):
    # 1회차: text="보안 정책은...", vector=[0.1,-0.3], meta={"page":1}
    # 2회차: text="개인정보는...", vector=[0.2,-0.1], meta={"page":2}

# strict=True: 리스트 길이가 다르면 에러 (데이터 불일치 방지)
```

#### `upsert`란?

**upsert = update + insert**. 이미 있는 문서는 업데이트, 없는 문서는 새로 삽입합니다.

```
기존 DB:  [uuid-001: "보안 정책은..."]

upsert([uuid-001: "보안 정책 수정", uuid-002: "채용 절차는..."]):
  uuid-001 → 이미 있음 → 업데이트
  uuid-002 → 없음 → 새로 삽입

결과:     [uuid-001: "보안 정책 수정", uuid-002: "채용 절차는..."]
```

**청킹 시각화**:
```
원본 텍스트: "AAAA...BBBB...CCCC..." (3000자)

chunk_size=1000, chunk_overlap=200:

chunk1: [AAAA...BBBB] (0 ~ 1000자)
chunk2:       [BBBB...CCCC] (800 ~ 1800자)  ← 200자 겹침
chunk3:             [CCCC...DDDD] (1600 ~ 2600자)  ← 200자 겹침

겹침이 왜 필요? 문장이 청크 경계에서 잘리는 경우 문맥 유지
```

---

### 4-8. `app/services/spring_client.py` — Spring 서버 클라이언트

**역할**: Spring Java 서버의 REST API를 호출하는 비동기 HTTP 클라이언트입니다.

#### `httpx`란?

Python의 **비동기 HTTP 클라이언트** 라이브러리입니다. `requests` 라이브러리와 비슷하지만 `async/await`를 지원합니다.

```python
# requests (동기 — FastAPI에서 사용하면 서버 블로킹):
import requests
response = requests.get("https://api.com/data")

# httpx (비동기 — FastAPI에서 권장):
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.com/data")
```

#### `ContextVar`란?

Python `contextvars` 모듈에서 제공하는 **비동기 요청별 독립 변수**입니다. 같은 서버에서 여러 요청이 동시에 처리될 때 각 요청의 데이터가 섞이지 않도록 격리합니다.

```python
import contextvars

# 요청별 독립 변수 (동시 요청 간 충돌 방지)
request_bearer_token: ContextVar[str] = ContextVar("request_bearer_token", default="")
request_w1ne_role: ContextVar[str] = ContextVar("request_w1ne_role", default="")
request_w1ne_type: ContextVar[str] = ContextVar("request_w1ne_type", default="")

class SpringApiClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.spring_base_url.rstrip("/")
        # rstrip("/") → 끝의 "/" 제거: "http://server.com/" → "http://server.com"
        # 나중에 path를 붙일 때 "//rule/" 이 되지 않도록

        self._fallback_token = settings.spring_jwt_token
        self._timeout = settings.spring_request_timeout
        self._verify_ssl = settings.spring_verify_ssl

    def _headers(self) -> dict:
        """Spring API 요청 헤더 구성"""
        headers = {"Content-Type": "application/json"}

        # 토큰 우선순위: 현재 요청의 토큰 → .env 폴백 토큰
        token = request_bearer_token.get("") or self._fallback_token
        if token:
            headers["Authorization"] = f"Bearer {token}"

        # 월넛 연산자(:=)로 변수 할당과 None 체크를 동시에 수행
        if role := request_w1ne_role.get(""):
            # role = request_w1ne_role.get("")
            # role이 빈 문자열이 아니면 True → 헤더에 추가
            headers["W1ne-Role"] = role
        if type_ := request_w1ne_type.get(""):
            headers["W1ne-Type"] = type_

        return headers

    async def post(self, path: str, json_data: dict = None) -> dict:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(
            timeout=self._timeout,
            verify=self._verify_ssl  # 회사 프록시 환경에서는 False
        ) as client:
            response = await client.post(url, json=json_data, headers=self._headers())
            response.raise_for_status()  # 4xx, 5xx면 예외 발생
            return response.json()
```

#### `:=` (월넛 연산자 / walrus operator)란?

Python 3.8에서 추가된 문법입니다. **값을 변수에 대입하면서 동시에 조건 검사**를 합니다.

```python
# 월넛 연산자 없이:
role = request_w1ne_role.get("")
if role:
    headers["W1ne-Role"] = role

# 월넛 연산자 사용:
if role := request_w1ne_role.get(""):
    headers["W1ne-Role"] = role
# → 한 줄로 줄어듦 (role에 값 대입 + 빈 문자열인지 체크)
```

#### `async with httpx.AsyncClient() as client`란?

**`async with`는 비동기 컨텍스트 매니저**입니다. HTTP 연결을 열고, 작업이 끝나면 자동으로 닫아줍니다.

```python
# 수동 관리 (위험: close 잊으면 연결 누수):
client = httpx.AsyncClient()
response = await client.post(url)
await client.aclose()

# async with 사용 (안전: 자동으로 닫힘):
async with httpx.AsyncClient() as client:
    response = await client.post(url)
# ← 이 줄에서 자동으로 client.aclose() 실행
```

#### `response.raise_for_status()`란?

HTTP 응답 코드가 4xx(클라이언트 오류) 또는 5xx(서버 오류)이면 **예외를 발생**시킵니다.

```
200 OK          → 정상 통과
201 Created     → 정상 통과
400 Bad Request → HTTPStatusError 예외 발생!
404 Not Found   → HTTPStatusError 예외 발생!
500 Server Error → HTTPStatusError 예외 발생!
```

**토큰 전파 흐름**:
```
프론트엔드
  Authorization: Bearer <JWT>
  W1ne-Role: ADMIN
  W1ne-Type: USER
       │
       ▼
FastAPI chat.py (_set_request_context)
  request_bearer_token.set("JWT값")
  request_w1ne_role.set("ADMIN")
       │
       ▼ (나중에 Tool Calling 발생 시)
SpringApiClient._headers()
  ContextVar에서 자동으로 꺼내서 헤더에 추가
       │
       ▼
Spring Java 서버
  Authorization: Bearer <JWT>  ← 그대로 전달됨!
```

---

### 4-9. `app/tools/spring_api_tools.py` — LangChain Tool 정의

**역할**: LLM이 호출할 수 있는 Tool(함수)을 정의합니다.

#### `Literal` 타입이란?

특정 값만 허용하는 타입 힌트입니다. Java의 enum과 비슷합니다.

```python
from typing import Literal

RuleStyle = Literal["SPREAD", "FLOW", "LOGIC", "BUNDLE", "DBIO", "SCRIPT", "MATRIX"]
# RuleStyle 타입의 변수에는 위 7개 값 중 하나만 들어갈 수 있음

style: RuleStyle = "SPREAD"   # OK
style: RuleStyle = "UNKNOWN"  # 타입 에러!

# LLM이 이 타입 정보를 보고 유효한 값만 선택함
```

```python
from langchain_core.tools import tool

@tool
async def request_rule_input() -> dict:
    """룰 생성에 필요한 정보를 사용자에게 UI 폼으로 요청합니다.

    사용자가 룰 생성을 요청하면 **항상** 이 도구를 먼저 호출하세요.
    """
    # __ui_request__ 키를 반환하면 그래프에서 특별 처리
    return {
        "__ui_request__": {
            "type": "create_rule_form",
            "required_fields": ["name", "folder_id", "start_date", "style"],
        }
    }

@tool
async def create_rule(name: str, folder_id: int, start_date: str, style: RuleStyle) -> dict:
    """사용자가 UI 폼을 통해 제출한 데이터로 룰을 실제 생성합니다."""
    payload = {
        "name": name,
        "isMain": False,
        "style": style,
        "folderId": folder_id,
        "input": {"update": []},
        "output": {"update": []},
        "startDate": start_date,
        "update": [],
    }
    client = get_spring_client()
    return await client.post("/solution/wne3-modern/hrs/designer/v1/rule/", json_data=payload)
```

#### `@tool` 데코레이터의 역할

LangChain의 `@tool`은 Python 함수를 **LLM이 이해할 수 있는 Tool 스키마**로 자동 변환합니다. 함수명, 타입 힌트, docstring을 분석해서 LLM에게 전달할 JSON 스키마를 생성합니다.

```python
# @tool 없이 직접 LLM에 전달하면...
def create_rule(name, folder_id, ...):
    ...
# LLM이 이해 못함 (그냥 Python 함수일 뿐)

# @tool 데코레이터 적용하면...
@tool
async def create_rule(name: str, folder_id: int, ...):
    """룰을 생성합니다."""
    ...
# LLM에게 이렇게 전달됨 (JSON Schema):
# {
#   "name": "create_rule",
#   "description": "룰을 생성합니다.",        ← docstring에서 자동 추출
#   "parameters": {
#     "name": {"type": "string"},              ← 타입 힌트에서 자동 추출
#     "folder_id": {"type": "integer"},
#     ...
#   }
# }
# → LLM이 "아, create_rule은 룰 생성 도구고, name과 folder_id가 필요하구나!" 라고 이해
```

**docstring이 중요한 이유**:
```python
@tool
async def request_rule_input() -> dict:
    """룰 생성에 필요한 정보를 사용자에게 UI 폼으로 요청합니다.

    사용자가 룰 생성을 요청하면 **항상** 이 도구를 먼저 호출하세요.
    create_rule을 직접 호출하지 말고, 이 도구로 UI 폼을 통해 정보를 수집합니다.
    """
# ↑ 이 docstring을 LLM이 읽고 "언제" 이 도구를 사용할지 판단함
# → "사용자가 룰 생성을 요청하면 항상" → "룰 생성해줘" 메시지에 반응
```

#### `__ui_request__` 센티넬 패턴

Tool 반환값에 `__ui_request__` 키가 있으면 **"이건 일반 결과가 아니라 UI 폼 요청이다"**를 뜻합니다. `tool_executor_node`에서 이 키를 감지해서 특별 처리합니다.

```python
# 일반 Tool 결과:
return {"id": 101, "name": "급여규칙"}  # → LLM에게 전달되어 자연어 응답 생성

# UI 폼 요청 (센티넬 키):
return {"__ui_request__": {"type": "create_rule_form", ...}}
# → tool_executor가 감지 → 그래프 종료 → 프론트에 폼 표시
```

#### `get_all_tools()`

등록된 모든 Tool을 리스트로 반환합니다. `chatbot_graph.py`에서 이 함수를 호출해서 LLM에 바인딩합니다.

```python
def get_all_tools() -> list:
    return [request_rule_input, create_rule]
    # 새 Tool을 추가하면 이 리스트에 넣으면 됨
```

---

### 4-10. `app/services/chatbot_graph.py` — LangGraph 핵심 로직

**역할**: 전체 챗봇 대화 흐름을 상태머신으로 구현합니다. 이 프로젝트의 핵심 파일입니다.

#### `TypedDict`란?

Python의 딕셔너리에 **타입을 지정**할 수 있게 해주는 클래스입니다. 일반 dict와 달리 "어떤 키가 있고, 각 키의 값은 무슨 타입인지" 명확히 정의합니다.

```python
from typing import TypedDict

# 일반 dict (키와 타입이 불명확):
state = {"messages": [...], "route": "rag"}  # 아무 키나 넣을 수 있음

# TypedDict (키와 타입이 고정):
class ChatState(TypedDict):
    messages: list    # "messages" 키 = 리스트
    route: str        # "route" 키 = 문자열
# → IDE가 자동완성 제공, 잘못된 키 사용 시 경고
```

#### `Annotated`란?

타입에 **추가 메타데이터**(정보)를 붙이는 방법입니다. LangGraph에서는 **상태 업데이트 방식**을 지정하는 데 사용합니다.

```python
from typing import Annotated
from langgraph.graph.message import add_messages

messages: Annotated[list[BaseMessage], add_messages]
#         ^^^^^^^^  ^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^
#         키워드     원래 타입           메타데이터 (업데이트 방식)
```

#### `add_messages` 리듀서란?

LangGraph에서 상태를 업데이트하는 방식을 정의하는 함수입니다. `add_messages`는 **메시지를 덮어쓰지 않고 누적**합니다.

```python
# add_messages 없이 (일반 dict):
state["messages"] = [HumanMessage("안녕")]
state["messages"] = [AIMessage("반가워")]
# 결과: [AIMessage("반가워")]  ← 덮어써짐!

# add_messages 리듀서 사용:
messages: Annotated[list[BaseMessage], add_messages]
# 노드가 {"messages": [AIMessage("반가워")]} 반환 시
# 결과: [HumanMessage("안녕"), AIMessage("반가워")]  ← 누적됨!
```

#### ChatState — 그래프의 공유 상태

```python
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    # 대화 메시지 목록 (누적됨)

    thread_id: str          # 대화 ID (같은 ID면 이전 대화 이어감)
    context: str            # RAG 검색 결과 (문서 발췌)
    route: str              # "rag" | "general" (질문 분류 결과)
    ui_request: dict        # UI 폼 요청 데이터 (없으면 빈 dict)
```

#### `BaseMessage` 종류

LangChain에서 채팅 메시지를 표현하는 클래스 계층입니다.

```python
from langchain_core.messages import (
    HumanMessage,   # 사용자 메시지 (role: "user")
    AIMessage,      # AI 응답 (role: "assistant") — tool_calls 포함 가능
    SystemMessage,  # 시스템 프롬프트 (role: "system") — LLM 행동 지침
    ToolMessage,    # Tool 실행 결과 (role: "tool") — tool_call_id로 연결
)

# 예시: 전체 대화 흐름
messages = [
    SystemMessage("당신은 AI 어시스턴트입니다."),
    HumanMessage("룰 생성해줘"),
    AIMessage(content="", tool_calls=[{"name": "request_rule_input", ...}]),
    ToolMessage(content="[사용자 UI 입력 대기 중]", tool_call_id="call_xyz"),
]
```

#### 노드 1: route_node — 질문 분류

**왜 스트리밍 OFF 모델을 별도로 사용하나?**
```
스트리밍 ON 모델로 분류하면:
  LLM 응답 "{"route": "rag"}" 가 토큰 단위로 스트림에 흘러나감
  → 프론트에 "{", "\"route\"", ": ", "\"rag\"}" 가 표시됨 (원하지 않는 동작!)

스트리밍 OFF 모델로 분류하면:
  응답이 완성될 때까지 기다렸다가 한 번에 받음
  → 스트림에 노출 안됨 (깔끔)
```

```python
async def route_node(state: ChatState) -> dict:
    # 마지막 사용자 메시지 추출
    # reversed() = 뒤에서부터 탐색 (최신 메시지가 가장 중요)
    user_message = [m for m in reversed(messages) if isinstance(m, HumanMessage)][0]
    # isinstance(m, HumanMessage) = m이 HumanMessage 타입인지 확인

    # 스트리밍 OFF 모델로 분류 (temperature=0, streaming=False)
    response = await route_model.ainvoke([
        SystemMessage(content=ROUTE_SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ])
    # ainvoke = 비동기 호출 (invoke의 async 버전)

    # JSON 파싱: {"route": "rag"} 또는 {"route": "general"}
    parsed = json.loads(response.content)
    return {"route": parsed.get("route", "general")}
    # .get("route", "general") = "route" 키가 없으면 "general"을 기본값으로
```

**라우팅 예시**:
```
"룰 생성해줘"    → {"route": "rag"}     → retrieve → agent_chat
"안녕하세요"     → {"route": "general"} → direct_chat
"파이썬 알려줘"  → {"route": "general"} → direct_chat
"회사 정책 뭐야" → {"route": "rag"}     → retrieve → agent_chat
```

#### 노드 2: retrieve_node — 벡터 검색

```python
async def retrieve_node(state: ChatState) -> dict:
    # 사용자 질문 임베딩
    embeddings = AzureOpenAIEmbeddings(...)
    query_vector = await embeddings.aembed_query(user_message)
    # "룰 생성해줘" → [0.123, -0.456, ...]

    # 유사한 문서 청크 5개 검색
    chunks = vector_search(query_vector=query_vector, top_k=5)

    # 컨텍스트 문자열로 조합
    context = "\n\n---\n\n".join([
        f"[{chunk.filename} / p.{chunk.page_number}]\n{chunk.content}"
        for chunk in chunks
    ])
    return {"context": context}
```

#### 노드 3: agent_chat_node — Tool Calling LLM

#### `model.bind_tools()`란?

LLM에게 "이런 도구들을 사용할 수 있어"라고 알려주는 메서드입니다. Tool의 스키마(이름, 설명, 파라미터)를 LLM API 호출에 포함시킵니다.

```python
model = get_azure_chat_model()                           # 기본 모델
model_with_tools = model.bind_tools(get_all_tools())     # Tool 바인딩된 모델

# 차이:
# model.ainvoke(...)           → LLM이 텍스트만 생성
# model_with_tools.ainvoke(...) → LLM이 텍스트 또는 Tool 호출을 결정
```

```python
async def agent_chat_node(state: ChatState) -> dict:
    context = state.get("context", "")

    # RAG 컨텍스트를 시스템 프롬프트에 주입
    # _build_system_message = AGENT_SYSTEM_PROMPT + "\n\n문서 발췌:\n{context}"
    system_msg = _build_system_message(AGENT_SYSTEM_PROMPT, context)

    # _ensure_system_message = 메시지 목록 첫 번째에 SystemMessage를 교체/추가
    messages = _ensure_system_message(messages, system_msg)

    # Tool이 바인딩된 모델로 호출
    response = await model_with_tools.ainvoke(messages)
    # response = AIMessage (내부에 content 또는 tool_calls 포함)

    return {"messages": [response]}
    # → add_messages 리듀서에 의해 기존 메시지 리스트에 누적됨
```

**LLM의 응답은 두 가지 형태 중 하나**:
```python
# ① Tool 호출이 없는 경우 (직접 답변):
AIMessage(
    content="룰 생성을 위해...",  # ← 자연어 텍스트
    tool_calls=[]                 # ← 빈 리스트
)
# → should_continue() → END (그래프 종료)

# ② Tool 호출이 있는 경우:
AIMessage(
    content="",                   # ← 비어있음
    tool_calls=[
        {
            "name": "request_rule_input",  # 호출할 Tool 이름
            "args": {},                     # Tool에 전달할 인자
            "id": "call_abc123"            # 이 호출의 고유 ID
        }
    ]
)
# → should_continue() → tool_executor (Tool 실행으로 이동)
```

#### 노드 4: tool_executor_node — Tool 실행

#### `tool_map`이란?

Tool 이름을 키로, Tool 함수를 값으로 가지는 딕셔너리입니다. LLM이 반환한 tool 이름으로 실제 함수를 찾아 실행합니다.

```python
tools = get_all_tools()  # [request_rule_input, create_rule]
tool_map = {t.name: t for t in tools}
# tool_map = {
#   "request_rule_input": request_rule_input 함수,
#   "create_rule": create_rule 함수,
# }

# LLM이 "request_rule_input" 호출을 요청하면:
result = await tool_map["request_rule_input"].ainvoke({})
```

```python
async def tool_executor_node(state: ChatState) -> dict:
    last_message = state["messages"][-1]  # AIMessage with tool_calls
    tool_messages = []
    ui_request = {}

    for tc in last_message.tool_calls:
        # 실제 함수 실행
        result = await tool_map[tc["name"]].ainvoke(tc["args"])

        # __ui_request__ 감지
        if isinstance(result, dict) and "__ui_request__" in result:
            ui_request = result["__ui_request__"]
            # Tool 결과로 "대기 중" 메시지 저장
            tool_messages.append(ToolMessage(
                content="[사용자 UI 입력 대기 중]",
                tool_call_id=tc["id"]
            ))
        else:
            tool_messages.append(ToolMessage(
                content=json.dumps(result),
                tool_call_id=tc["id"]
            ))

    return_dict = {"messages": tool_messages}
    if ui_request:
        return_dict["ui_request"] = ui_request  # 상태에 저장 → after_tool_executor에서 감지
    return return_dict
```

#### 조건 함수 — 분기 결정

LangGraph에서 노드 다음에 어디로 갈지 결정하는 함수입니다. 반환값이 다음 노드 이름이 됩니다.

```python
def should_continue(state: ChatState) -> Literal["tool_executor", "__end__"]:
    """agent_chat 이후: tool 호출이 있으면 실행, 없으면 종료"""
    last_message = state["messages"][-1]
    # hasattr() = 객체에 특정 속성이 있는지 확인
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tool_executor"   # → tool_executor 노드로 이동
    return END                   # → 그래프 종료 (END = "__end__")

def after_tool_executor(state: ChatState) -> Literal["agent_chat", "__end__"]:
    """tool_executor 이후: UI 요청이 있으면 종료, 없으면 agent_chat으로 루프"""
    if state.get("ui_request"):
        return END   # → 프론트가 폼을 표시하고 사용자 입력 대기 (그래프 종료)
    return "agent_chat"  # → 결과를 LLM에게 전달해서 자연어 응답 생성 (루프)
```

**왜 두 개의 조건 함수가 필요한가?**
```
agent_chat → should_continue:
  tool_calls 있음? → tool_executor (도구 실행)
  tool_calls 없음? → END (텍스트 응답이 완성됨)

tool_executor → after_tool_executor:
  ui_request 있음? → END (UI 폼 표시를 위해 그래프 중단)
  ui_request 없음? → agent_chat (도구 결과를 LLM에게 돌려보냄)
```

#### 그래프 조립

```python
graph_builder = StateGraph(ChatState)
# StateGraph = 상태를 공유하는 그래프 빌더
# ChatState = 그래프 전체에서 공유하는 상태 타입

# 노드 등록: add_node("이름", 함수)
graph_builder.add_node("router", route_node)
graph_builder.add_node("retrieve", retrieve_node)
graph_builder.add_node("agent_chat", agent_chat_node)
graph_builder.add_node("tool_executor", tool_executor_node)
graph_builder.add_node("direct_chat", direct_chat_node)

# 무조건 이동: add_edge(출발, 도착)
graph_builder.add_edge(START, "router")      # 시작 → router
graph_builder.add_edge("retrieve", "agent_chat")  # retrieve → agent_chat
graph_builder.add_edge("direct_chat", END)    # direct_chat → 종료

# 조건부 이동: add_conditional_edges(출발, 조건함수, 매핑)
graph_builder.add_conditional_edges(
    "router",           # 출발 노드
    route_condition,    # 조건 함수 (반환값이 키가 됨)
    {"rag": "retrieve", "general": "direct_chat"}  # 반환값 → 도착 노드 매핑
)
# route_condition이 "rag" 반환 → retrieve로 이동
# route_condition이 "general" 반환 → direct_chat으로 이동

graph_builder.add_conditional_edges("agent_chat", should_continue,
    {"tool_executor": "tool_executor", END: END})

graph_builder.add_conditional_edges("tool_executor", after_tool_executor,
    {"agent_chat": "agent_chat", END: END})
```

#### `MemorySaver`란?

LangGraph의 **체크포인터**로, 대화 히스토리를 메모리에 저장합니다. `thread_id`별로 상태를 관리하므로, 같은 thread_id로 다시 요청하면 이전 대화를 이어갈 수 있습니다.

```python
memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)
# compile() = 그래프 정의 완료, 실행 가능한 객체 생성

# 사용 시:
config = {"configurable": {"thread_id": "abc-123"}}
result = await graph.ainvoke({"messages": [...]}, config)
# → thread_id="abc-123"의 이전 대화 상태를 불러와서 이어감
```

```
첫 요청 (thread_id = "abc-123"):
  messages: [HumanMessage("안녕"), AIMessage("반가워요!")]
  → MemorySaver에 저장

두 번째 요청 (thread_id = "abc-123"):
  MemorySaver에서 이전 상태 복원
  messages: [HumanMessage("안녕"), AIMessage("반가워요!"), HumanMessage("룰 만들어줘")]
  → LLM이 이전 대화 맥락을 알고 응답

다른 사용자 (thread_id = "xyz-789"):
  messages: [HumanMessage("파이썬 알려줘")]
  → abc-123과 완전히 독립된 대화
```

#### `astream_events()`란?

그래프 실행 중 발생하는 모든 이벤트를 실시간으로 받는 메서드입니다. `chat_stream()`에서 스트리밍에 사용합니다.

```python
async for event in graph.astream_events(input, config, version="v2"):
    # event 예시:
    # {"event": "on_chain_start", "name": "router", ...}     ← 노드 시작
    # {"event": "on_chat_model_stream", "data": {"chunk": ...}} ← LLM 토큰
    # {"event": "on_chain_end", "name": "router", ...}       ← 노드 종료
```

#### `aget_state()`란?

그래프의 현재 상태를 조회하는 메서드입니다. `astream_events`로는 노드의 반환값을 직접 확인하기 어려워서, 스트림 종료 후 최종 상태를 확인할 때 사용합니다.

```python
final_state = await graph.aget_state(config)
ui_request = final_state.values.get("ui_request", {})
# → tool_executor에서 설정한 ui_request 값을 여기서 꺼냄
```

---

## 5. 실제 코드 흐름 — 채팅 요청

### 시나리오: "룰 생성해줘" 스트리밍 요청

```
POST /api/v1/chat/stream
Headers: Authorization: Bearer <JWT>
Body: {"message": "룰 생성해줘", "thread_id": null}
```

#### STEP 1: FastAPI가 요청 수신

```
[app/routers/chat.py] stream_message()

1. raw.headers.get("authorization") → "Bearer eyJhb..."
2. _set_request_context(raw) 호출
   → request_bearer_token.set("eyJhb...")  ← ContextVar에 저장
   → request_w1ne_role.set("")
3. EventSourceResponse(generate_stream("룰 생성해줘", None)) 반환
   → SSE 스트림 시작
```

#### STEP 2: generate_stream 시작

```
[app/routers/chat.py] generate_stream()

chat_stream("룰 생성해줘", None) 호출 → async 제너레이터 시작
```

#### STEP 3: chat_stream 시작 — 그래프 실행

```
[app/services/chatbot_graph.py] chat_stream()

thread_id = uuid4() 생성 (예: "a1b2-c3d4-...")

graph.astream_events(
    {
        "messages": [HumanMessage("룰 생성해줘")],
        "thread_id": "a1b2-c3d4-...",
        "context": "",
        "route": "",
        "ui_request": {},   ← 매 요청마다 초기화 (이전 상태 오염 방지)
    },
    config={"configurable": {"thread_id": "a1b2-c3d4-..."}}
)
```

#### STEP 4: router 노드 실행

```
[app/services/chatbot_graph.py] route_node()

이벤트: on_chain_start, name="router"
→ chat_stream에서 감지 → yield {"stage": "routing"}
→ generate_stream에서 감지
→ 프론트로 전송: event: message, data: {"stage": "routing"}

LLM 호출 (streaming=False):
  입력: [SystemMessage(ROUTE_SYSTEM_PROMPT), HumanMessage("룰 생성해줘")]
  출력: '{"route": "rag"}'

반환: {"route": "rag"}
그래프 상태 업데이트: state["route"] = "rag"
```

#### STEP 5: route_condition — "rag" 경로 선택

```
route_condition(state) → "rag" 반환
→ retrieve 노드로 이동
```

#### STEP 6: retrieve 노드 실행

```
[app/services/chatbot_graph.py] retrieve_node()

이벤트: on_chain_start, name="retrieve"
→ chat_stream에서 감지 → yield {"stage": "searching"}
→ 프론트로 전송: event: message, data: {"stage": "searching"}

1. AzureOpenAIEmbeddings.aembed_query("룰 생성해줘")
   → [0.123, -0.456, 0.789, ...] (1536차원 벡터)

2. vector_search(query_vector=[...], top_k=5)
   → Azure AI Search에서 유사한 문서 청크 5개 반환

3. context 문자열 조합:
   "[manual.pdf / p.3]\n룰 생성 방법은...\n\n---\n\n[manual.pdf / p.4]\n..."

반환: {"context": "..."}
```

#### STEP 7: agent_chat 노드 실행

```
[app/services/chatbot_graph.py] agent_chat_node()

이벤트: on_chain_start, name="agent_chat"
→ chat_stream에서 감지 → yield {"stage": "generating"}
→ 프론트로 전송: event: message, data: {"stage": "generating"}

시스템 메시지 구성:
  AGENT_SYSTEM_PROMPT + "\n\n문서 발췌:\n[manual.pdf / p.3]..."

Tool이 바인딩된 모델 호출:
  사용 가능한 Tools: [request_rule_input, create_rule]

  LLM 판단: "룰 생성을 요청했으니 request_rule_input을 호출해야겠다"

  응답: AIMessage(
    content="",
    tool_calls=[{
      "name": "request_rule_input",
      "args": {},
      "id": "call_xyz789"
    }]
  )

반환: {"messages": [AIMessage(tool_calls=[...])]}
```

#### STEP 8: should_continue — tool_executor로 분기

```
should_continue(state):
  last_message.tool_calls = [{"name": "request_rule_input", ...}]
  → tool_calls 있음! → "tool_executor" 반환
```

#### STEP 9: tool_executor 노드 실행

```
[app/services/chatbot_graph.py] tool_executor_node()

이벤트: on_chain_start, name="tool_executor"
→ chat_stream에서 감지 → yield {"stage": "calling_api"}
→ 프론트로 전송: event: message, data: {"stage": "calling_api"}

tool_calls 순회:
  tc = {"name": "request_rule_input", "args": {}, "id": "call_xyz789"}

  result = await request_rule_input.ainvoke({})
  # result = {
  #   "__ui_request__": {
  #     "type": "create_rule_form",
  #     "required_fields": ["name", "folder_id", "start_date", "style"]
  #   }
  # }

  "__ui_request__" 감지!
  ui_request = {"type": "create_rule_form", "required_fields": [...]}

  tool_messages.append(ToolMessage(
    content="[사용자 UI 입력 대기 중]",
    tool_call_id="call_xyz789"
  ))

반환: {
  "messages": [ToolMessage(...)],
  "ui_request": {"type": "create_rule_form", ...}
}
그래프 상태 업데이트: state["ui_request"] = {"type": "create_rule_form", ...}
```

#### STEP 10: after_tool_executor — 그래프 종료

```
after_tool_executor(state):
  state.get("ui_request") = {"type": "create_rule_form", ...}  ← 있음!
  → END 반환 (그래프 종료)
```

#### STEP 11: chat_stream — 최종 상태 확인 후 ui_request yield

```
[app/services/chatbot_graph.py] chat_stream()

스트림 이벤트 루프 종료 후:

final_state = await graph.aget_state(config)
ui_request = final_state.values.get("ui_request", {})
# = {"type": "create_rule_form", "required_fields": [...]}

ui_request 있음!
yield {
  "ui_request": {"type": "create_rule_form", "required_fields": [...]},
  "thread_id": "a1b2-c3d4-..."
}
```

#### STEP 12: generate_stream — ui_request SSE 이벤트 전송

```
[app/routers/chat.py] generate_stream()

item = {"ui_request": {...}, "thread_id": "a1b2-c3d4-..."}
"ui_request" in item → True!

yield {
  "event": "ui_request",
  "data": '{"ui_request": {"type": "create_rule_form", "required_fields": [...]}, "thread_id": "a1b2-..."}'
}
```

#### STEP 13: done 이벤트 전송

```
yield {
  "event": "done",
  "data": '{"thread_id": "a1b2-c3d4-..."}'
}
```

#### 전체 SSE 스트림 결과

```
event: message
data: {"stage": "routing"}

event: message
data: {"stage": "searching"}

event: message
data: {"stage": "calling_api"}

event: message
data: {"stage": "generating"}

event: ui_request
data: {"ui_request": {"type": "create_rule_form", "required_fields": ["name", "folder_id", "start_date", "style"]}, "thread_id": "a1b2-c3d4-..."}

event: done
data: {"thread_id": "a1b2-c3d4-..."}
```

---

### 시나리오: [FORM_SUBMIT] 후 실제 룰 생성

사용자가 UI 폼을 작성하고 제출하면:

```
POST /api/v1/chat/stream
Body: {
  "message": "[FORM_SUBMIT:create_rule] {\"name\":\"급여규칙\",\"folder_id\":42,\"start_date\":\"20260101\",\"style\":\"SPREAD\"}",
  "thread_id": "a1b2-c3d4-..."  ← 동일한 thread_id 사용!
}
```

#### STEP 1~4: route_node — "rag" 분류

```
LLM이 "[FORM_SUBMIT:create_rule]" 패턴을 보고 "rag"로 분류
```

#### STEP 5: retrieve_node

```
벡터 검색 수행 (관련 문서 청크 검색)
```

#### STEP 6: agent_chat_node

```
시스템 프롬프트에 있는 규칙:
  "[FORM_SUBMIT:create_rule] 형태의 메시지는 사용자가 폼을 통해 제출한 데이터"
  "이 데이터를 파싱하여 create_rule 도구를 호출하세요"

LLM 판단: "폼 데이터를 파싱해서 create_rule 호출"
응답: AIMessage(
  tool_calls=[{
    "name": "create_rule",
    "args": {
      "name": "급여규칙",
      "folder_id": 42,
      "start_date": "20260101",
      "style": "SPREAD"
    }
  }]
)
```

#### STEP 7: tool_executor_node

```
create_rule.ainvoke({"name": "급여규칙", "folder_id": 42, ...}) 실행

→ SpringApiClient.post("/solution/wne3-modern/hrs/designer/v1/rule/", payload)
  헤더: Authorization: Bearer <사용자JWT>  ← ContextVar에서 자동 추출!

→ Spring 서버 응답: {"id": 101, "name": "급여규칙", "status": "created"}

__ui_request__ 없음 → ToolMessage로 결과 저장
반환: {"messages": [ToolMessage('{"id": 101, "name": "급여규칙", ...}')]}
```

#### STEP 8: after_tool_executor — agent_chat으로 루프

```
state.get("ui_request") = {}  ← 비어 있음
→ "agent_chat" 반환 (루프!)
```

#### STEP 9: agent_chat_node (2번째)

```
이제 메시지 목록:
  [HumanMessage("[FORM_SUBMIT:create_rule]..."),
   AIMessage(tool_calls=[create_rule...]),
   ToolMessage('{"id": 101, "name": "급여규칙"...}')]  ← Tool 결과

LLM이 Tool 결과를 보고 자연어 응답 생성:
응답 스트리밍:
  "급여규칙" → "룰" → "이" → " " → "성공" → "적" → "으로" → " " → "생성" → ...

각 청크가 프론트로 실시간 전송:
  event: message, data: {"content": "급여규칙", "thread_id": "..."}
  event: message, data: {"content": "룰이", "thread_id": "..."}
  ...
```

---

## 6. 실제 코드 흐름 — 문서 업로드

```
POST /api/v1/documents/upload
Content-Type: multipart/form-data
Body: [PDF 파일]
```

#### STEP 1: document.py — upload_document()

**`UploadFile`**은 FastAPI에서 파일 업로드를 처리하는 클래스입니다. `File(...)`은 "이 파라미터는 HTTP multipart 파일이다"를 나타냅니다.

```python
[app/routers/document.py]

# file: UploadFile = File(...)
# → HTTP multipart/form-data에서 파일을 받음
# → file.filename = 파일명 ("manual.pdf")
# → file.content_type = MIME 타입 ("application/pdf")
# → file.read() = 파일 내용을 바이트로 읽기

async def upload_document(file: UploadFile = File(...)):
    # 파일 형식 검증
    if file.content_type not in ("application/pdf", ...):
        raise HTTPException(400, "PDF만 업로드 가능")
        # HTTPException = FastAPI에서 HTTP 에러를 반환하는 예외 클래스
        # 400 = Bad Request (클라이언트의 잘못된 요청)

    file_bytes = await file.read()  # 파일 내용을 메모리로 읽기 (바이트)
    chunks_indexed = await process_and_index_pdf(
        file_bytes=file_bytes,
        filename=file.filename
    )
    return {"filename": "manual.pdf", "chunks_indexed": 42, "index_name": "pdf-rag-index"}
```

#### STEP 2: pdf_processor.py — process_and_index_pdf()

```python
[app/services/pdf_processor.py]

# ① PDF 파싱
reader = PdfReader(io.BytesIO(file_bytes))
# reader.pages = [Page1, Page2, ...]

# ② 페이지별 텍스트 추출 + 청킹
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

for page_index, page in enumerate(reader.pages):
    page_text = page.extract_text()
    # page_text = "1페이지 내용: 룰 생성이란 비즈니스 규칙을..."

    chunks = splitter.split_text(page_text)
    # chunks = ["룰 생성이란 비즈니스 규칙을...", "규칙을 정의하는 과정..."]

    for chunk in chunks:
        texts.append(chunk)
        metadatas.append({"filename": "manual.pdf", "page_number": 1})
```

#### STEP 3: 임베딩 생성

```python
embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-3-small"  # 1536차원
)
vectors = embeddings.embed_documents(texts)
# texts[0] = "룰 생성이란..." → vectors[0] = [0.1, -0.3, ...]
# texts[1] = "규칙을 정의하는..." → vectors[1] = [0.2, -0.1, ...]
# ... (모든 청크를 한 번의 API 호출로 임베딩)
```

#### STEP 4: ensure_index_exists() — 인덱스 확인/생성

```python
[app/services/azure_search.py]

def ensure_index_exists(vector_dimensions=1536):
    try:
        existing = index_client.get_index("pdf-rag-index")
        # 인덱스 이미 존재 + 필수 필드 있음 → 그냥 리턴
        if required_fields.issubset(existing_field_names):
            return
        # 필수 필드 없음 → 삭제 후 재생성
        index_client.delete_index("pdf-rag-index")
    except ResourceNotFoundError:
        pass  # 인덱스 없음 → 새로 생성

    index_client.create_index(_build_index("pdf-rag-index", 1536))
```

#### STEP 5: upsert_chunks() — Azure Search에 저장

```python
documents = [
    {
        "id": "550e8400-...",     # UUID
        "content": "룰 생성이란...",
        "content_vector": [0.1, -0.3, ...],  # 1536개 숫자
        "filename": "manual.pdf",
        "page_number": 1
    },
    ...
]

search_client.upload_documents(documents=documents)
# Azure AI Search에 일괄 저장 (upsert: 있으면 업데이트, 없으면 삽입)
```

---

## 7. 실제 코드 흐름 — Tool Calling & UI Form

### UI 폼 요청 전체 흐름 다이어그램

```
사용자: "룰 생성해줘"
    │
    ▼
[FastAPI] chat.py
 _set_request_context() → ContextVar에 JWT 저장
 generate_stream() 시작
    │
    ▼
[chatbot_graph.py] chat_stream()
 graph.astream_events() 실행
    │
    ▼
[route_node]
 LLM: {"route": "rag"}
 → yield {"stage": "routing"}
    │
    ▼
[retrieve_node]
 임베딩 → 벡터검색 → context 구성
 → yield {"stage": "searching"}
    │
    ▼
[agent_chat_node]
 model_with_tools.ainvoke(...)
 LLM: tool_calls=[{name: "request_rule_input"}]
 → yield {"stage": "generating"} (실제 텍스트 생성은 없음)
    │
    ▼
[tool_executor_node]
 request_rule_input() 실행
 결과: {"__ui_request__": {"type": "create_rule_form", ...}}
 "__ui_request__" 감지 → state["ui_request"] 저장
 → yield {"stage": "calling_api"}
    │
    ▼
[after_tool_executor]
 ui_request 있음 → END
    │
    ▼
[chat_stream] 스트림 루프 종료 후
 final_state.values["ui_request"] 확인
 → yield {"ui_request": {...}, "thread_id": "..."}
    │
    ▼
[generate_stream]
 "ui_request" in item → True
 → SSE: event: ui_request, data: {...}
 → SSE: event: done, data: {...}
    │
    ▼
프론트엔드 (Vue3)
 event: "ui_request" 수신
 → create_rule_form 컴포넌트 렌더링
 → 사용자가 폼 입력 후 제출
    │
    ▼
사용자: "[FORM_SUBMIT:create_rule] {"name": "급여규칙", ...}"
    │
    ▼
[agent_chat_node] (다음 요청)
 LLM: 폼 데이터 파싱 → create_rule 호출
    │
    ▼
[tool_executor_node]
 create_rule(name="급여규칙", folder_id=42, ...) 실행
 → SpringApiClient.post(url, payload)
   헤더: Authorization: Bearer <JWT> (ContextVar에서 자동 추출)
    │
    ▼
[Spring Java 서버]
 룰 생성 완료
 → {"id": 101, "name": "급여규칙", "status": "created"}
    │
    ▼
[after_tool_executor]
 ui_request 없음 → agent_chat으로 루프
    │
    ▼
[agent_chat_node]
 LLM: Tool 결과를 자연어로 설명
 → "급여규칙 룰이 성공적으로 생성되었습니다!"
 → 스트리밍으로 프론트에 전송
```

---

## 8. 환경 설정

### `.env` 파일 설정

```bash
# Azure OpenAI (필수)
AZURE_OPENAI_ENDPOINT=https://<리소스명>.openai.azure.com/
AZURE_OPENAI_API_KEY=<API 키>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Azure AI Search (RAG용 벡터 DB)
AZURE_SEARCH_ENDPOINT=https://<검색서비스명>.search.windows.net
AZURE_SEARCH_API_KEY=<Admin API 키>
AZURE_SEARCH_INDEX_NAME=pdf-rag-index
AZURE_SEARCH_VERIFY_SSL=true

# 임베딩 모델
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
# ↑ 차원: text-embedding-3-large=3072, text-embedding-3-small=1536

# Spring Java 서버
SPRING_BASE_URL=https://your-spring-server.com
SPRING_JWT_TOKEN=<서버간 통신용 JWT (프론트 토큰 없을 때 폴백)>
SPRING_REQUEST_TIMEOUT=30.0
SPRING_VERIFY_SSL=false  # 내부망 자체 서명 인증서면 false

# 애플리케이션
APP_ENV=development
APP_DEBUG=true
APP_PORT=8000
```

### 서버 실행

```bash
# 개발 환경 (자동 재시작)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 프로덕션 환경 (gunicorn + uvicorn workers)
gunicorn app.main:app -c gunicorn.conf.py
```

### API 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 서버 정보 |
| GET | `/health` | 헬스 체크 |
| POST | `/api/v1/chat` | 채팅 (동기) |
| POST | `/api/v1/chat/stream` | 채팅 (SSE 스트리밍) |
| POST | `/api/v1/documents/upload` | PDF 업로드 및 인덱싱 |
| POST | `/api/v1/documents/index/reset` | 인덱스 초기화 |

### API 사용 예제

**채팅 스트리밍 (JavaScript)**:
```javascript
const eventSource = new EventSource('/api/v1/chat/stream');

fetch('/api/v1/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <JWT>',
    'W1ne-Role': 'ADMIN',
  },
  body: JSON.stringify({
    message: "룰 생성해줘",
    thread_id: null,  // null이면 새 대화
  })
});

// SSE 이벤트 처리
eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  if (data.stage) {
    console.log('진행 중:', data.stage);  // "routing", "searching", ...
  } else if (data.content) {
    process.stdout.write(data.content);  // 실시간 텍스트 출력
  }
});

eventSource.addEventListener('ui_request', (e) => {
  const data = JSON.parse(e.data);
  // data.ui_request.type = "create_rule_form"
  // → 해당 폼 컴포넌트 렌더링
  showForm(data.ui_request);
});

eventSource.addEventListener('done', (e) => {
  const data = JSON.parse(e.data);
  console.log('완료! thread_id:', data.thread_id);
});
```

**PDF 업로드**:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/v1/documents/upload', {
  method: 'POST',
  body: formData
});
const result = await response.json();
// {"filename": "manual.pdf", "chunks_indexed": 42, "index_name": "pdf-rag-index"}
```

---

## 패키지 의존성 정리

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `fastapi` | 0.115.6 | 웹 프레임워크 |
| `uvicorn` | 0.32.1 | ASGI 서버 |
| `langchain` | 0.3.14 | LLM 오케스트레이션 |
| `langchain-openai` | 0.3.0 | Azure OpenAI 연동 |
| `langgraph` | 0.2.60 | 상태머신 기반 챗봇 흐름 |
| `langgraph-checkpoint` | 2.0.10 | 대화 히스토리 저장 |
| `sse-starlette` | 2.1.3 | SSE 스트리밍 지원 |
| `azure-search-documents` | >=11.4.0 | Azure AI Search 클라이언트 |
| `azure-identity` | 1.19.0 | Azure AD 인증 |
| `pydantic` | 2.10.4 | 데이터 검증 |
| `pydantic-settings` | 2.7.0 | 환경변수 설정 관리 |
| `httpx` | 0.28.1 | 비동기 HTTP 클라이언트 |
| `pypdf` | >=4.0.0 | PDF 텍스트 추출 |
