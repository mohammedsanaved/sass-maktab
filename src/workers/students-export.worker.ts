import { registerWorker, type QueueJob } from '@/lib/queue/queue';
import { generateStudentsCsv } from '@/modules/students-export/students-export.service';
import { STUDENTS_EXPORT_JOB_TYPE } from '@/workers/job-types';

registerWorker(
  STUDENTS_EXPORT_JOB_TYPE,
  async (job: QueueJob) => {
    const csvContent = await generateStudentsCsv();
    return {
      jobId: job.id,
      fileName: `students_export_${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      csvContent,
    };
  }
);

export { STUDENTS_EXPORT_JOB_TYPE };
