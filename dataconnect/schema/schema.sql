
CREATE TABLE users (
    userId STRING PRIMARY KEY
);

CREATE TABLE bills (
    billId STRING PRIMARY KEY
);

-- Extend users table with location and personal data
ALTER TABLE users ADD COLUMN 
  email STRING,
  firstName STRING,
  lastName STRING,
  address STRING,
  city STRING,
  state STRING,
  zipCode STRING,
  congressionalDistrict STRING,
  stateSenatedistrict STRING,
  stateHouseDistrict STRING,
  birthYear INT64,
  gender STRING,
  maritalStatus STRING,
  politicalAffiliation STRING,
  education STRING,
  profession STRING,
  militaryService BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP;

-- Contact directory (extends your members table concept)
CREATE TABLE contact_directory (
  contactId STRING PRIMARY KEY,
  bioguideId STRING, -- links to your existing members table
  contactType STRING, -- federal_senator, federal_rep, state_senator, mayor, etc.
  name STRING,
  title STRING,
  party STRING,
  state STRING,
  district STRING,
  office STRING,
  email STRING,
  phone STRING,
  mailingAddress STRING,
  website STRING,
  preferredContactMethod STRING,
  responsiveness_score FLOAT64,
  isActive BOOLEAN,
  tags ARRAY<STRING>, -- committee_chair, bill_sponsor, etc.
  lastUpdated TIMESTAMP
);

-- Message templates for different bill types
CREATE TABLE message_templates (
  templateId STRING PRIMARY KEY,
  billType STRING,
  position STRING, -- support, oppose, neutral
  templateText STRING,
  personalDataFields ARRAY<STRING>, -- which user fields to include
  tone STRING, -- formal, personal, urgent
  isActive BOOLEAN,
  createdAt TIMESTAMP
);

-- User advocacy messages sent
CREATE TABLE user_messages (
  messageId STRING PRIMARY KEY,
  userId STRING,
  billId STRING,
  templateId STRING,
  messageContent STRING,
  personalDataIncluded JSON, -- stores selected user data
  recipientContactIds ARRAY<STRING>,
  deliveryMethods ARRAY<STRING>, -- email, usps
  status STRING, -- draft, queued, sent, delivered, failed
  sentAt TIMESTAMP,
  deliveryCosts JSON, -- breakdown by method
  confirmationNumbers JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(userId),
  FOREIGN KEY (billId) REFERENCES bills(billId)
);

-- Track individual message deliveries
CREATE TABLE message_deliveries (
  deliveryId STRING PRIMARY KEY,
  messageId STRING,
  contactId STRING,
  deliveryMethod STRING,
  status STRING, -- sent, delivered, bounced, failed
  deliveredAt TIMESTAMP,
  confirmationNumber STRING,
  cost FLOAT64,
  errorMessage STRING,
  FOREIGN KEY (messageId) REFERENCES user_messages(messageId),
  FOREIGN KEY (contactId) REFERENCES contact_directory(contactId)
);

-- User location to representative mapping
CREATE TABLE user_representatives (
  userId STRING,
  contactId STRING,
  representativeType STRING, -- federal_senator, federal_rep, state_senator, etc.
  isPrimary BOOLEAN, -- true for user's direct reps
  createdAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(userId),
  FOREIGN KEY (contactId) REFERENCES contact_directory(contactId),
  PRIMARY KEY (userId, contactId)
);
