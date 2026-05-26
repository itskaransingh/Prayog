-- Add upper_body_html and lower_body_html columns to questions table
-- These allow admins to add collapsible content sections above and below the main task/resource content

ALTER TABLE questions ADD COLUMN upper_body_html TEXT;
ALTER TABLE questions ADD COLUMN lower_body_html TEXT;