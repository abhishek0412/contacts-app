import React from "react";
import { render, screen } from "@testing-library/react";
import ContactCard from "./ContactCard";

describe("ContactCard", () => {
  const contact = { name: "Jane Smith", phone: "(555) 234-5678" };

  it("renders the contact name", () => {
    render(<ContactCard contact={contact} />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders the phone number", () => {
    render(<ContactCard contact={contact} />);
    expect(screen.getByText("(555) 234-5678")).toBeInTheDocument();
  });

  it("renders avatar with correct initials", () => {
    const { container } = render(<ContactCard contact={contact} />);
    const avatar = container.querySelector(".detail-avatar");
    expect(avatar).toHaveTextContent("JS");
  });

  it("handles single-word name initials", () => {
    const { container } = render(
      <ContactCard contact={{ name: "Prince", phone: "1234567890" }} />,
    );
    const avatar = container.querySelector(".detail-avatar");
    expect(avatar).toHaveTextContent("P");
  });
});
