
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_size TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  open_answer TEXT DEFAULT '',
  section_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  overall_band TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow anonymous inserts (public quiz, no auth required)
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON public.quiz_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No SELECT policy for anon - data is write-only from the frontend
