---
inclusion: always
---

# Product Overview

JATA (Job Application Tailoring Assistant) is an AI-powered platform that helps job seekers optimize their applications for specific roles. The system automates resume tailoring using AI analysis to match job descriptions with candidate qualifications.

## Core Features

- **Browser Extension**: Captures job descriptions from any website
- **AI Resume Tailoring**: Analyzes job descriptions and provides keyword/skill suggestions using Hugging Face models
- **Analytics Dashboard**: Tracks application performance metrics (conversion rates, success by source)
- **Jata Score**: Quantifiable alignment score for each tailored application
- **Resume Vault**: Secure storage for multiple resume versions

## Architecture

The platform consists of three main applications:
- **Web Dashboard** (`apps/web`): React-based user interface for managing applications and AI tailoring
- **Browser Extension** (`apps/extension`): Chrome/Firefox extension for job description scraping
- **API** (`apps/api`): Supabase Edge Functions for backend logic

## Key User Flows

1. User scrapes job description via browser extension
2. Job data is stored in Supabase PostgreSQL
3. User navigates to resume tailoring page for specific application
4. AI analyzes job description against user's resume
5. System provides actionable suggestions and Jata Score
6. User tracks application progress through analytics dashboard
