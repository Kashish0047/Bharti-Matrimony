import Contact from "../models/contact.model.js";

export const createContact = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ message: "All fields are required." });
        }
        const contact = await Contact.create({ name, email, phone, message });
        res.status(201).json({ message: "Contact created successfully.", contact });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({ message: "Contacts fetched successfully.", contacts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact query not found" });
    }
    res.json({ message: "Contact query deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};