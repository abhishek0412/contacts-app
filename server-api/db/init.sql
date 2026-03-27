CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(128) NOT NULL,

    -- Core identity (columns — searchable, sortable, displayed in list)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    is_favorite BOOLEAN DEFAULT false,

    -- Grouped optional data (JSONB)
    personal JSONB DEFAULT '{}',       -- { nickname, gender, dob, alt_phone }
    address JSONB DEFAULT '{}',        -- { street, city, state, zip, country }
    professional JSONB DEFAULT '{}',   -- { role, website, linkedin, notes }

    -- Media
    profile_photo_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B-tree indexes for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_created ON contacts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(user_id, is_favorite) WHERE is_favorite = true;

-- Full-text search across name, email, company, and city (from JSONB)
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(
    to_tsvector('english',
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(email, '') || ' ' ||
        COALESCE(company, '') || ' ' ||
        COALESCE(address->>'city', '')
    )
);

-- GIN index on address JSONB for filtered queries
CREATE INDEX IF NOT EXISTS idx_contacts_address ON contacts USING GIN(address);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed data: 20 fake contacts for demo purposes
-- Uses 'Smg7xfBGHtSQ01sVnqLbOquqUNz1' as user_id. Every column & JSONB key filled.
-- ============================================================
INSERT INTO contacts (user_id, first_name, last_name, email, phone, company, is_favorite, personal, address, professional, profile_photo_url, created_at)
VALUES
  -- 1. Aarav Mehta
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Aarav', 'Mehta', 'aarav.mehta@gmail.com', '+91 9876543210', 'TechCorp', true,
   '{"nickname": "Aaru", "gender": "Male", "dob": "1994-03-22", "alt_phone": "+91 9876500001"}',
   '{"street": "14 MG Road, Colaba", "city": "Mumbai", "state": "Maharashtra", "zip": "400001", "country": "India"}',
   '{"role": "Lead Engineer", "website": "https://aarav.dev", "linkedin": "https://linkedin.com/in/aaravmehta", "notes": "Key technical contact for API integrations. Leads the platform team."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=c084fc',
   NOW() - INTERVAL '2 days'),

  -- 2. Priya Sharma
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Priya', 'Sharma', 'priya.sharma@outlook.com', '+91 8855443322', 'DataFlow', true,
   '{"nickname": "Pri", "gender": "Female", "dob": "1996-07-15", "alt_phone": "+91 8855440002"}',
   '{"street": "8 Baner Road, Aundh", "city": "Pune", "state": "Maharashtra", "zip": "411045", "country": "India"}',
   '{"role": "Data Scientist", "website": "https://priyasharma.io", "linkedin": "https://linkedin.com/in/priyasharma", "notes": "ML pipeline expert. Built the recommendation engine."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=f472b6',
   NOW() - INTERVAL '5 days'),

  -- 3. Rohan Desai
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Rohan', 'Desai', 'rohan.d@techcorp.com', '+91 7744332211', 'TechCorp', false,
   '{"nickname": "Ro", "gender": "Male", "dob": "1991-11-30", "alt_phone": "+91 7744330003"}',
   '{"street": "22 Linking Road, Bandra", "city": "Mumbai", "state": "Maharashtra", "zip": "400050", "country": "India"}',
   '{"role": "DevOps Lead", "website": "https://rohandesai.com", "linkedin": "https://linkedin.com/in/rohandesai", "notes": "Manages CI/CD pipelines. Kubernetes & Terraform expert."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=RD&backgroundColor=818cf8',
   NOW() - INTERVAL '10 days'),

  -- 4. Neha Kapoor
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Neha', 'Kapoor', 'neha.k@websyncinc.com', '+91 9988776655', 'WebSync', true,
   '{"nickname": "Neh", "gender": "Female", "dob": "1993-01-08", "alt_phone": "+91 9988770004"}',
   '{"street": "5 Residency Road, Shantinagar", "city": "Bangalore", "state": "Karnataka", "zip": "560025", "country": "India"}',
   '{"role": "Frontend Architect", "website": "https://nehakapoor.dev", "linkedin": "https://linkedin.com/in/nehakapoor", "notes": "React & design systems specialist. Maintains the component library."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=NK&backgroundColor=fb923c',
   NOW() - INTERVAL '1 day'),

  -- 5. Vikram Rathi
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Vikram', 'Rathi', 'vikram@applab.io', '+91 8877665544', 'AppLab', false,
   '{"nickname": "Vik", "gender": "Male", "dob": "1989-05-19", "alt_phone": "+91 8877660005"}',
   '{"street": "101 Koramangala 4th Block", "city": "Bangalore", "state": "Karnataka", "zip": "560034", "country": "India"}',
   '{"role": "CTO", "website": "https://applab.io", "linkedin": "https://linkedin.com/in/vikramrathi", "notes": "Founding team member. Handles partnerships and tech strategy."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=VR&backgroundColor=34d399',
   NOW() - INTERVAL '15 days'),

  -- 6. Ananya Iyer
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Ananya', 'Iyer', 'ananya.iyer@cloudnine.tech', '+91 7766554433', 'CloudNine', true,
   '{"nickname": "Anu", "gender": "Female", "dob": "1995-09-12", "alt_phone": "+91 7766550006"}',
   '{"street": "33 Anna Nagar Main Road", "city": "Chennai", "state": "Tamil Nadu", "zip": "600040", "country": "India"}',
   '{"role": "Cloud Engineer", "website": "https://ananyaiyer.com", "linkedin": "https://linkedin.com/in/ananyaiyer", "notes": "Azure & AWS certified. Led the multi-cloud migration."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=AI&backgroundColor=a78bfa',
   NOW() - INTERVAL '3 days'),

  -- 7. Kabir Singh
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Kabir', 'Singh', 'kabir.singh@devstudio.in', '+91 6655443322', 'DevStudio', false,
   '{"nickname": "Kabs", "gender": "Male", "dob": "1990-12-05", "alt_phone": "+91 6655440007"}',
   '{"street": "7 Sector 18, Block C", "city": "Noida", "state": "Uttar Pradesh", "zip": "201301", "country": "India"}',
   '{"role": "Full Stack Developer", "website": "https://kabirsingh.dev", "linkedin": "https://linkedin.com/in/kabirsingh", "notes": "Node.js & React specialist. Built the notification system."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=KS&backgroundColor=60a5fa',
   NOW() - INTERVAL '20 days'),

  -- 8. Meera Joshi
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Meera', 'Joshi', 'meera.j@dataflow.com', '+91 5544332211', 'DataFlow', false,
   '{"nickname": "Mee", "gender": "Female", "dob": "1997-04-28", "alt_phone": "+91 5544330008"}',
   '{"street": "12 FC Road, Deccan Gymkhana", "city": "Pune", "state": "Maharashtra", "zip": "411004", "country": "India"}',
   '{"role": "Backend Engineer", "website": "https://meerajoshi.dev", "linkedin": "https://linkedin.com/in/meerajoshi", "notes": "PostgreSQL & Redis optimization. Built the caching layer."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=MJ&backgroundColor=f87171',
   NOW() - INTERVAL '8 days'),

  -- 9. Arjun Nair
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Arjun', 'Nair', 'arjun.nair@websync.io', '+91 4433221100', 'WebSync', true,
   '{"nickname": "AJ", "gender": "Male", "dob": "1992-08-17", "alt_phone": "+91 4433220009"}',
   '{"street": "9 Marine Drive, Fort Kochi", "city": "Kochi", "state": "Kerala", "zip": "682001", "country": "India"}',
   '{"role": "UX Designer", "website": "https://arjunnair.design", "linkedin": "https://linkedin.com/in/arjunnair", "notes": "Figma & design systems expert. Created the dark theme."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=AN&backgroundColor=fbbf24',
   NOW() - INTERVAL '12 days'),

  -- 10. Divya Gupta
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Divya', 'Gupta', 'divya.g@techcorp.com', '+91 3322110099', 'TechCorp', false,
   '{"nickname": "Div", "gender": "Female", "dob": "1994-06-03", "alt_phone": "+91 3322110010"}',
   '{"street": "45 Connaught Place, Block A", "city": "New Delhi", "state": "Delhi", "zip": "110001", "country": "India"}',
   '{"role": "Product Manager", "website": "https://divyagupta.com", "linkedin": "https://linkedin.com/in/divyagupta", "notes": "Handles roadmap for Contact Manager. Stakeholder communication lead."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=DG&backgroundColor=e879f9',
   NOW() - INTERVAL '25 days'),

  -- 11. Siddharth Patel
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Siddharth', 'Patel', 'sid.patel@applab.io', '+91 2211009988', 'AppLab', false,
   '{"nickname": "Sid", "gender": "Male", "dob": "1988-10-21", "alt_phone": "+91 2211000011"}',
   '{"street": "18 SG Highway, Bodakdev", "city": "Ahmedabad", "state": "Gujarat", "zip": "380015", "country": "India"}',
   '{"role": "QA Lead", "website": "https://sidpatel.dev", "linkedin": "https://linkedin.com/in/sidpatel", "notes": "End-to-end testing & automation. Playwright & Cypress."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=SP&backgroundColor=4ade80',
   NOW() - INTERVAL '30 days'),

  -- 12. Ishita Reddy
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Ishita', 'Reddy', 'ishita.r@cloudnine.tech', '+91 1100998877', 'CloudNine', true,
   '{"nickname": "Ishi", "gender": "Female", "dob": "1996-02-14", "alt_phone": "+91 1100990012"}',
   '{"street": "27 Jubilee Hills, Road No 36", "city": "Hyderabad", "state": "Telangana", "zip": "500033", "country": "India"}',
   '{"role": "Security Engineer", "website": "https://ishitareddy.sec", "linkedin": "https://linkedin.com/in/ishitareddy", "notes": "OWASP Top 10 & pen testing. Runs quarterly security audits."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=IR&backgroundColor=f472b6',
   NOW() - INTERVAL '6 days'),

  -- 13. Rahul Menon
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Rahul', 'Menon', 'rahul.menon@techcorp.com', '+91 9871234567', 'TechCorp', false,
   '{"nickname": "Ram", "gender": "Male", "dob": "1993-07-09", "alt_phone": "+91 9871230013"}',
   '{"street": "56 Indiranagar, 100 Feet Road", "city": "Bangalore", "state": "Karnataka", "zip": "560038", "country": "India"}',
   '{"role": "Staff Engineer", "website": "https://rahulmenon.io", "linkedin": "https://linkedin.com/in/rahulmenon", "notes": "Distributed systems architect. Designed the event-driven backend."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=RM&backgroundColor=38bdf8',
   NOW() - INTERVAL '4 days'),

  -- 14. Tanvi Deshmukh
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Tanvi', 'Deshmukh', 'tanvi.d@dataflow.com', '+91 8765432109', 'DataFlow', true,
   '{"nickname": "Tanu", "gender": "Female", "dob": "1995-11-25", "alt_phone": "+91 8765430014"}',
   '{"street": "3 Law College Road, Erandwane", "city": "Pune", "state": "Maharashtra", "zip": "411004", "country": "India"}',
   '{"role": "Analytics Lead", "website": "https://tanvideshmukh.com", "linkedin": "https://linkedin.com/in/tanvideshmukh", "notes": "Built the real-time analytics dashboard. Tableau & Power BI expert."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=TD&backgroundColor=fb7185',
   NOW() - INTERVAL '1 day'),

  -- 15. Aditya Saxena
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Aditya', 'Saxena', 'aditya.s@devstudio.in', '+91 7654321098', 'DevStudio', false,
   '{"nickname": "Adi", "gender": "Male", "dob": "1991-04-16", "alt_phone": "+91 7654320015"}',
   '{"street": "29 Gomti Nagar, Sector 11", "city": "Lucknow", "state": "Uttar Pradesh", "zip": "226010", "country": "India"}',
   '{"role": "Mobile Developer", "website": "https://adityasaxena.dev", "linkedin": "https://linkedin.com/in/adityasaxena", "notes": "React Native & Flutter. Published 5 apps on Play Store."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=a3e635',
   NOW() - INTERVAL '18 days'),

  -- 16. Kavya Krishnan
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Kavya', 'Krishnan', 'kavya.k@websync.io', '+91 6543210987', 'WebSync', true,
   '{"nickname": "Kav", "gender": "Female", "dob": "1998-01-30", "alt_phone": "+91 6543210016"}',
   '{"street": "71 Thiruvanmiyur, ECR Road", "city": "Chennai", "state": "Tamil Nadu", "zip": "600041", "country": "India"}',
   '{"role": "Technical Writer", "website": "https://kavyakrishnan.com", "linkedin": "https://linkedin.com/in/kavyakrishnan", "notes": "API documentation & developer experience. Maintains the docs site."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=KK&backgroundColor=c084fc',
   NOW() - INTERVAL '7 days'),

  -- 17. Harsh Vardhan
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Harsh', 'Vardhan', 'harsh.v@applab.io', '+91 5432109876', 'AppLab', false,
   '{"nickname": "HV", "gender": "Male", "dob": "1987-09-03", "alt_phone": "+91 5432100017"}',
   '{"street": "44 Civil Lines, Mall Road", "city": "Jaipur", "state": "Rajasthan", "zip": "302006", "country": "India"}',
   '{"role": "Engineering Manager", "website": "https://harshvardhan.tech", "linkedin": "https://linkedin.com/in/harshvardhan", "notes": "Manages 3 engineering squads. Agile coach & scrum master."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=HV&backgroundColor=fcd34d',
   NOW() - INTERVAL '22 days'),

  -- 18. Riya Banerjee
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Riya', 'Banerjee', 'riya.b@cloudnine.tech', '+91 4321098765', 'CloudNine', false,
   '{"nickname": "Ri", "gender": "Female", "dob": "1997-12-18", "alt_phone": "+91 4321090018"}',
   '{"street": "15 Park Street, Mullick Bazar", "city": "Kolkata", "state": "West Bengal", "zip": "700016", "country": "India"}',
   '{"role": "SRE Engineer", "website": "https://riyabanerjee.dev", "linkedin": "https://linkedin.com/in/riyabanerjee", "notes": "Site reliability & incident management. Built the alerting system."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=RB&backgroundColor=67e8f9',
   NOW() - INTERVAL '14 days'),

  -- 19. Manish Tiwari
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Manish', 'Tiwari', 'manish.t@techcorp.com', '+91 3210987654', 'TechCorp', true,
   '{"nickname": "Mani", "gender": "Male", "dob": "1990-06-27", "alt_phone": "+91 3210980019"}',
   '{"street": "82 Kothrud, Paud Road", "city": "Pune", "state": "Maharashtra", "zip": "411038", "country": "India"}',
   '{"role": "Solutions Architect", "website": "https://manishtiwari.com", "linkedin": "https://linkedin.com/in/manishtiwari", "notes": "Enterprise architecture & system design. AWS Solutions Architect Pro certified."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=MT&backgroundColor=818cf8',
   NOW() - INTERVAL '9 days'),

  -- 20. Sneha Kulkarni
  ('Smg7xfBGHtSQ01sVnqLbOquqUNz1', 'Sneha', 'Kulkarni', 'sneha.k@dataflow.com', '+91 2109876543', 'DataFlow', false,
   '{"nickname": "Sne", "gender": "Female", "dob": "1994-08-11", "alt_phone": "+91 2109870020"}',
   '{"street": "6 Viman Nagar, Phoenix Mall Road", "city": "Pune", "state": "Maharashtra", "zip": "411014", "country": "India"}',
   '{"role": "Data Engineer", "website": "https://snehakulkarni.io", "linkedin": "https://linkedin.com/in/snehakulkarni", "notes": "Spark & Kafka pipelines. Built the real-time data ingestion layer."}',
   'https://api.dicebear.com/7.x/initials/svg?seed=SK&backgroundColor=f472b6',
   NOW() - INTERVAL '11 days')

ON CONFLICT DO NOTHING;
