// OGCW contact details, shared by the Work with OGCW band and the footer.
export const BUSINESS_EMAIL = "business@ogcultureworld.com";

// A mailto link with the enquiry type as the subject, e.g. mail("Press").
export const mail = (subject: string) => `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(subject)}`;
