# PolicyGPT

PolicyGPT is a government policy and scheme assistance platform that helps citizens find and check their eligibility for government schemes.

## Project Setup

### Backend
- FastAPI project initialized.
- Eligibility Checker API implemented.
- Eligibility request schema and eligibility service implemented.
- Scheme matching logic implemented.

### Frontend
- Angular frontend initialized.
- Eligibility Checker form implemented.
- Frontend integrated with the FastAPI backend.
- Scheme matching results displayed in the frontend.

## Eligibility Checker Module

The implemented Eligibility Checker includes:

1. **Eligibility Form**
2. **User Profile Analysis**
3. **Scheme Matching**
4. **Eligibility Summary**
5. **Recommended Schemes**
6. **Application Guidance**

## Eligibility Parameters

The Eligibility Checker uses:

- Age
- Gender
- Income
- Occupation
- Education
- Location
- Social Category
- Disability Status

## Current Implementation

The user enters their eligibility details through the Angular form. The details are sent to the FastAPI backend, where the user's profile is checked against the available schemes.

The system returns:

- Eligible schemes
- Eligibility status
- Eligibility reasons
- Scheme details
- Recommended schemes
- Application guidance

## Testing

The Eligibility Checker has been tested with different student and unemployed-user profiles, and the eligibility results and scheme details are working correctly.
