import { Request, Response } from "express";
import {
  getAllCustomerContactsService,
  getCustomerContactByIdService,
  getCustomerContactsByCustomerIdService,
  createCustomerContactService,
  updateCustomerContactService,
  deleteCustomerContactService,
} from "../services/customerContactsServices";
import { validateCustomerContactData } from "../utils/validation";

export async function getAllCustomerContacts(req: Request, res: Response): Promise<void> {
  try {
    const contacts = await getAllCustomerContactsService();

    res.status(200).json({
      success: true,
      data: contacts,
      message: "Data customer contacts berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contacts:", error);

    let message = "Terjadi kesalahan saat mengambil data.";

    if (error instanceof Error && error.message.includes("does not exist")) {
      message = "Data belum tersedia di database.";
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
}

export async function getCustomerContactById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID customer contact diperlukan",
      });
      return;
    }

    const contact = await getCustomerContactByIdService(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: "Customer contact tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
      message: "Data customer contact berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contact by ID:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data customer contact",
    });
  }
}

export async function getCustomerContactsByCustomerId(req: Request, res: Response): Promise<void> {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      res.status(400).json({
        success: false,
        message: "ID customer diperlukan",
      });
      return;
    }

    const contacts = await getCustomerContactsByCustomerIdService(customerId);

    res.status(200).json({
      success: true,
      data: contacts,
      message: "Data customer contacts berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contacts by customer ID:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data customer contacts",
    });
  }
}

export async function createCustomerContact(req: Request, res: Response): Promise<void> {
  try {
    const contactData = req.body;

    // Validasi data
    const validation = validateCustomerContactData(contactData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid",
        errors: validation.errors,
      });
      return;
    }

    const newContact = await createCustomerContactService(contactData);

    res.status(201).json({
      success: true,
      data: newContact,
      message: "Customer contact berhasil dibuat",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error creating customer contact:", error);

    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      res.status(400).json({
        success: false,
        message: "Customer dengan ID tersebut tidak ditemukan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat customer contact",
    });
  }
}

export async function createCustomerContactForCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { customerId } = req.params;
    const contactData = req.body;

    if (!customerId) {
      res.status(400).json({
        success: false,
        message: "ID customer diperlukan",
      });
      return;
    }

    // Add customer_id to contact data
    const contactWithCustomerId = {
      ...contactData,
      customer_id: customerId,
    };

    // Validasi data
    const validation = validateCustomerContactData(contactWithCustomerId);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid",
        errors: validation.errors,
      });
      return;
    }

    const newContact = await createCustomerContactService(contactWithCustomerId);

    res.status(201).json({
      success: true,
      data: newContact,
      message: "Customer contact berhasil dibuat",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error creating customer contact for customer:", error);

    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      res.status(400).json({
        success: false,
        message: "Customer dengan ID tersebut tidak ditemukan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat customer contact",
    });
  }
}

export async function updateCustomerContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contactData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID customer contact diperlukan",
      });
      return;
    }

    // Validasi data (untuk update, semua field bersifat opsional)
    const validation = validateCustomerContactData(contactData, true);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid",
        errors: validation.errors,
      });
      return;
    }

    const updatedContact = await updateCustomerContactService(id, contactData);

    if (!updatedContact) {
      res.status(404).json({
        success: false,
        message: "Customer contact tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedContact,
      message: "Customer contact berhasil diperbarui",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error updating customer contact:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui customer contact",
    });
  }
}

export async function deleteCustomerContact(req: Request, res: Response): Promise<void> {
  try {
    // Support both /:id and /:customerId/contacts/:contactId routes
    const contactId = req.params.contactId || req.params.id;

    if (!contactId) {
      res.status(400).json({
        success: false,
        message: "ID customer contact diperlukan",
      });
      return;
    }

    const deleted = await deleteCustomerContactService(contactId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Customer contact tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer contact berhasil dihapus",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error deleting customer contact:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus customer contact",
    });
  }
}
