"use client";

import { ChevronDown, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BlogContent() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {/* Title Section */}
      <h1 className="mb-3 text-4xl font-bold tracking-tight">관계 설정</h1>
      <p className="text-lg text-muted-foreground mb-8">
        데이터베이스에서 테이블 간의 관계를 효과적으로 설정하는 방법을 알아봅니다.
      </p>

      <hr className="my-8 border-border" />

      {/* Before You Begin Section */}
      <section id="before-you-begin" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold mb-4">시작하기 전에</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="requirements" className="border rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline" id="requirements">
              <span className="text-base font-medium">필수 요구사항 설치</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-2">다음 도구들이 설치되어 있어야 합니다:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Node.js 18 이상</li>
                <li>PostgreSQL 또는 호환 데이터베이스</li>
                <li>패키지 관리자 (npm, yarn, 또는 pnpm)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="environment" className="border rounded-lg px-4" id="environment-setup">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-base font-medium">프로젝트 환경 설정</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>프로젝트 루트에 환경 변수 파일을 생성하고 데이터베이스 연결 정보를 설정하세요.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Things to Keep in Mind Section */}
      <section id="things-to-keep-in-mind" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold mb-4">주의사항</h2>
        <p className="text-muted-foreground mb-4">
          관계 설정 시 고려해야 할 중요한 사항들입니다. 데이터 무결성과 성능을 위해 반드시 확인하세요:
        </p>

        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>외래 키 제약 조건</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>인덱스 설정 및 최적화</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>캐스케이드 삭제 설정</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>데이터베이스 확장 및 설정</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            <span>복제 및 백업 전략</span>
          </li>
        </ul>
      </section>

      {/* How to Setup Section */}
      <section id="how-to-setup" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold mb-6">관계 설정 방법</h2>

        {/* Step 1 */}
        <div className="flex gap-4 mb-8" id="one-to-one">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium">
            1
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">일대일 관계 설정</h3>
            <p className="text-muted-foreground mb-4">
              사용자 프로필처럼 한 테이블의 레코드가 다른 테이블의 하나의 레코드와만 연결되는 경우에 사용합니다.
            </p>

            <Alert className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription>
                일대일 관계는 <code className="text-sm bg-muted px-1 py-0.5 rounded">UNIQUE</code> 제약 조건을 사용하여 
                구현합니다. 성능상 이점이 있는 경우에만 사용하세요.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 mb-8" id="one-to-many">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">일대다 관계 설정</h3>
            <p className="text-muted-foreground mb-4">
              게시글과 댓글처럼 한 테이블의 레코드가 다른 테이블의 여러 레코드와 연결되는 가장 일반적인 관계입니다.
            </p>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{`CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  content TEXT NOT NULL
);`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4" id="many-to-many">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium">
            3
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">다대다 관계 설정</h3>
            <p className="text-muted-foreground mb-4">
              사용자와 그룹처럼 양쪽 테이블 모두 여러 레코드와 연결될 수 있는 관계입니다. 
              중간 테이블(조인 테이블)을 사용하여 구현합니다.
            </p>

            <Alert className="bg-muted/50 border-muted">
              <Info className="h-4 w-4" />
              <AlertDescription>
                다대다 관계에서는 중간 테이블에 추가 필드(예: 생성일, 역할)를 포함할 수 있습니다. 
                이를 통해 관계에 대한 메타데이터를 저장할 수 있습니다.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold mb-4">자주 묻는 질문</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1" className="border rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-base font-medium">외래 키를 항상 사용해야 하나요?</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              외래 키는 데이터 무결성을 보장하지만, 대용량 데이터에서는 성능 영향을 고려해야 합니다. 
              상황에 따라 애플리케이션 레벨에서 관계를 관리하는 것이 더 적합할 수 있습니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border rounded-lg px-4 mb-2">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-base font-medium">관계 설정 후 마이그레이션은 어떻게 하나요?</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              데이터베이스 마이그레이션 도구를 사용하여 스키마 변경을 버전 관리할 수 있습니다. 
              대표적으로 Prisma, Drizzle, 또는 순수 SQL 마이그레이션을 사용할 수 있습니다.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-base font-medium">인덱스는 언제 추가해야 하나요?</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              외래 키 컬럼에는 기본적으로 인덱스를 추가하는 것이 좋습니다. 
              자주 조회하는 컬럼이나 WHERE 절에 사용되는 컬럼에도 인덱스를 고려하세요.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </article>
  );
}
