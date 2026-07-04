-- GDPR art. 17 (dreptul la ștergere): datele copilului nu mai supraviețuiesc
-- ștergerii elevului. Întâi curățăm rândurile deja orfane (elevi șterși istoric),
-- altfel ADD CONSTRAINT eșuează.

-- CleanOrphans
DELETE FROM "assignment_submissions" WHERE "studentId" NOT IN (SELECT "id" FROM "students");
DELETE FROM "llm_queries" WHERE "studentId" NOT IN (SELECT "id" FROM "students");
DELETE FROM "llm_reports" WHERE "studentId" NOT IN (SELECT "id" FROM "students");

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_queries" ADD CONSTRAINT "llm_queries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_reports" ADD CONSTRAINT "llm_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
