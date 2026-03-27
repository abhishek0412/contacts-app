/**
 * API helper — direct HTTP calls for test setup/teardown.
 * Uses the API directly (bypassing UI) for speed and reliability.
 */

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

class ApiHelper {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} authToken - Firebase ID token for authenticated requests
   */
  constructor(request, authToken = null) {
    this.request = request;
    this.authToken = authToken;
  }

  _headers() {
    const headers = { "Content-Type": "application/json" };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Create a contact via API.
   * @param {object} contactData
   * @returns {Promise<object>} Created contact with id
   */
  async createContact(contactData) {
    const response = await this.request.post(`${BASE_URL}/contacts`, {
      data: contactData,
      headers: this._headers(),
    });
    if (!response.ok()) {
      throw new Error(
        `Failed to create contact: ${response.status()} ${await response.text()}`,
      );
    }
    return response.json();
  }

  /**
   * Create multiple contacts via API.
   * @param {object[]} contacts
   * @returns {Promise<object[]>} Created contacts with ids
   */
  async createContacts(contacts) {
    const results = [];
    for (const contact of contacts) {
      results.push(await this.createContact(contact));
    }
    return results;
  }

  /**
   * Delete a contact by ID.
   * @param {string|number} id
   */
  async deleteContact(id) {
    const response = await this.request.delete(`${BASE_URL}/contacts/${id}`, {
      headers: this._headers(),
    });
    // 404 is OK — already deleted
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Failed to delete contact: ${response.status()}`);
    }
  }

  /**
   * Delete multiple contacts by IDs.
   * @param {Array<string|number>} ids
   */
  async deleteContacts(ids) {
    for (const id of ids) {
      await this.deleteContact(id);
    }
  }

  /**
   * Get all contacts.
   * @returns {Promise<object>} { contacts, total, page, limit, totalPages }
   */
  async getContacts(page = 1, limit = 50) {
    const response = await this.request.get(
      `${BASE_URL}/contacts?page=${page}&limit=${limit}`,
      { headers: this._headers() },
    );
    return response.json();
  }

  /**
   * Get contact stats.
   * @returns {Promise<object>} { total, recentlyAdded, favorites, companies }
   */
  async getStats() {
    const response = await this.request.get(`${BASE_URL}/contacts/stats`, {
      headers: this._headers(),
    });
    return response.json();
  }

  /**
   * Search contacts.
   * @param {string} query
   * @param {string} field - 'all', 'name', 'email', etc.
   * @returns {Promise<object[]>}
   */
  async searchContacts(query, field = "all") {
    const response = await this.request.get(
      `${BASE_URL}/contacts/search?q=${encodeURIComponent(query)}&field=${field}`,
      { headers: this._headers() },
    );
    return response.json();
  }

  /**
   * Update a contact.
   * @param {string|number} id
   * @param {object} data - Partial update data
   * @returns {Promise<object>}
   */
  async updateContact(id, data) {
    const response = await this.request.put(`${BASE_URL}/contacts/${id}`, {
      data,
      headers: this._headers(),
    });
    return response.json();
  }
}

module.exports = { ApiHelper };
