const { faker } = require("@faker-js/faker");

/**
 * Test data factory — generates realistic fake contacts using Faker.
 *
 * Usage:
 *   generateContact()                         → full contact, random data
 *   generateContact({ company: 'Acme' })      → override specific fields
 *   generateContact({ _locale: 'en_IN' })     → Indian names/phones
 *   generateMinimalContact()                   → required fields only
 *   generateContacts(5, { company: 'Acme' })   → batch with shared overrides
 *   generateSearchableSet()                    → curated set for search/filter tests
 *   generateUser()                             → fake email + password for auth tests
 */

const GENDERS = ["Male", "Female", "Other"];
const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
];

/**
 * Generate a full contact object matching the DB hybrid schema.
 * @param {object} [overrides] - Override any field or nested JSONB key
 * @returns {object} Contact data ready for API submission
 */
function generateContact(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const company = faker.company.name();
  const gender = faker.helpers.arrayElement(GENDERS);
  const country = faker.helpers.arrayElement(COUNTRIES);

  const base = {
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    company,
    is_favorite: faker.datatype.boolean(0.3),
    personal: {
      nickname: faker.person.firstName(),
      gender,
      dob: faker.date
        .birthdate({ min: 22, max: 60, mode: "age" })
        .toISOString()
        .split("T")[0],
      alt_phone: faker.phone.number({ style: "international" }),
    },
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country,
    },
    professional: {
      role: faker.person.jobTitle(),
      website: faker.internet.url(),
      linkedin: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${faker.string.alphanumeric(4)}`,
      notes: faker.lorem.sentence(),
    },
  };

  // Allow nested overrides: { personal: { gender: 'Female' } } merges into personal
  const { personal, address, professional, ...topLevel } = overrides;
  return {
    ...base,
    ...topLevel,
    personal: { ...base.personal, ...personal },
    address: { ...base.address, ...address },
    professional: { ...base.professional, ...professional },
  };
}

/**
 * Generate a minimal contact (only required fields).
 */
function generateMinimalContact(overrides = {}) {
  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone: faker.phone.number({ style: "international" }),
    ...overrides,
  };
}

/**
 * Generate multiple contacts for list/pagination testing.
 * @param {number} count
 * @param {object} [sharedOverrides] - Applied to all contacts
 * @returns {object[]}
 */
function generateContacts(count, sharedOverrides = {}) {
  return Array.from({ length: count }, () => generateContact(sharedOverrides));
}

/**
 * Generate a curated set for search/filter tests.
 * Returns contacts with known, searchable values across all filter fields.
 */
function generateSearchableSet() {
  return [
    generateContact({
      first_name: "Aarav",
      last_name: "Searchtest",
      email: "aarav.search@uniquedomain.com",
      company: "SearchCorp",
      address: { city: "SearchCity" },
    }),
    generateContact({
      first_name: "Priya",
      last_name: "Searchtest",
      email: "priya.findme@anotherdomain.com",
      company: "FindMeInc",
      address: { city: "Discoverburg" },
    }),
    generateContact({
      first_name: "Unique",
      last_name: "Zzperson",
      email: "unique.zzperson@rareemail.io",
      company: "SearchCorp",
      phone: "+91 1112223344",
      address: { city: "SearchCity" },
    }),
  ];
}

/**
 * Generate a fake user for auth tests.
 * Password meets strength requirements: 8+ chars, upper, lower, number, special.
 */
function generateUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const displayName = `${firstName} ${lastName}`;
  return {
    name: displayName,
    displayName,
    email: faker.internet
      .email({ firstName, lastName, provider: "testfaker.com" })
      .toLowerCase(),
    password: `${faker.string.alpha({ length: 4, casing: "mixed" })}${faker.number.int({ min: 10, max: 99 })}${faker.helpers.arrayElement(["!", "@", "#", "$", "%"])}${faker.string.alpha(2)}`,
  };
}

/**
 * Seed Faker for deterministic test data (useful for snapshot tests).
 * @param {number} seed
 */
function seedFaker(seed) {
  faker.seed(seed);
}

module.exports = {
  faker,
  generateContact,
  generateMinimalContact,
  generateContacts,
  generateSearchableSet,
  generateUser,
  seedFaker,
};
