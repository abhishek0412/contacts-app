import { getInitials } from "./useContactHelpers";

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
});
