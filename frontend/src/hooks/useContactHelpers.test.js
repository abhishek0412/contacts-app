import {
  getInitials,
  getFullName,
  formatPhone,
  getNestedField,
} from "./useContactHelpers";

describe("getInitials", () => {
  it("returns two initials for a two-word name", () => {
    expect(getInitials("Jane Smith")).toBe("JS");
  });

  it("returns two initials for a multi-word name", () => {
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });

  it("returns one initial for a single-word name", () => {
    expect(getInitials("Prince")).toBe("P");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("caps at two characters max", () => {
    expect(getInitials("A B C D E")).toBe("AB");
  });

  it("accepts a contact object with first_name and last_name", () => {
    expect(
      getInitials({ first_name: "Abhishek", last_name: "Choudhary" }),
    ).toBe("AC");
  });

  it("accepts a contact object with legacy name field", () => {
    expect(getInitials({ name: "Jane Smith" })).toBe("JS");
  });

  it("returns ? for empty contact", () => {
    expect(getInitials({})).toBe("?");
  });
});

describe("getFullName", () => {
  it("combines first_name and last_name", () => {
    expect(getFullName({ first_name: "John", last_name: "Doe" })).toBe(
      "John Doe",
    );
  });

  it("falls back to legacy name field", () => {
    expect(getFullName({ name: "Jane Smith" })).toBe("Jane Smith");
  });

  it("handles only first_name", () => {
    expect(getFullName({ first_name: "Prince" })).toBe("Prince");
  });

  it("returns empty string for null", () => {
    expect(getFullName(null)).toBe("");
  });
});

describe("formatPhone", () => {
  it("formats 10-digit number with +91 prefix", () => {
    expect(formatPhone("9975622955")).toBe("+91 99756 22955");
  });

  it("returns original for non-10-digit numbers", () => {
    expect(formatPhone("+91 9975622955")).toBe("+91 9975622955");
  });

  it("returns empty string for falsy input", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone(null)).toBe("");
  });
});

describe("getNestedField", () => {
  const contact = {
    personal: { nickname: "Abhi", gender: "Male" },
    address: { city: "Pune" },
  };

  it("extracts nested field", () => {
    expect(getNestedField(contact, "personal", "nickname")).toBe("Abhi");
  });

  it("returns fallback for missing field", () => {
    expect(getNestedField(contact, "personal", "dob", "N/A")).toBe("N/A");
  });

  it("returns fallback for missing section", () => {
    expect(getNestedField(contact, "professional", "role", "")).toBe("");
  });
});
