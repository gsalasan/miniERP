<<<<<<< HEAD
import { Request, Response } from 'express';
=======
import { Request, Response } from "express";
>>>>>>> main
import {
  getAllCustomerContactsService,
  getCustomerContactByIdService,
  getCustomerContactsByCustomerIdService,
  createCustomerContactService,
  updateCustomerContactService,
  deleteCustomerContactService,
<<<<<<< HEAD
} from '../services/customerContactsServices';
import { validateCustomerContactData } from '../utils/validation';

export async function getAllCustomerContacts(
  req: Request,
  res: Response
): Promise<void> {
=======
} from "../services/customerContactsServices";
import { validateCustomerContactData } from "../utils/validation";

export async function getAllCustomerContacts(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const contacts = await getAllCustomerContactsService();

    res.status(200).json({
      success: true,
      data: contacts,
<<<<<<< HEAD
      message: 'Data customer contacts berhasil diambil',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customer contacts:', error);

    let message = 'Terjadi kesalahan saat mengambil data.';

    if (error instanceof Error && error.message.includes('does not exist')) {
      message = 'Data belum tersedia di database.';
=======
      message: "Data customer contacts berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contacts:", error);

    let message = "Terjadi kesalahan saat mengambil data.";

    if (error instanceof Error && error.message.includes("does not exist")) {
      message = "Data belum tersedia di database.";
>>>>>>> main
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
}

<<<<<<< HEAD
export async function getCustomerContactById(
  req: Request,
  res: Response
): Promise<void> {
=======
export async function getCustomerContactById(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'ID customer contact diperlukan',
=======
        message: "ID customer contact diperlukan",
>>>>>>> main
      });
      return;
    }

    const contact = await getCustomerContactByIdService(id);

    if (!contact) {
      res.status(404).json({
        success: false,
<<<<<<< HEAD
        message: 'Customer contact tidak ditemukan',
=======
        message: "Customer contact tidak ditemukan",
>>>>>>> main
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contact,
<<<<<<< HEAD
      message: 'Data customer contact berhasil diambil',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customer contact by ID:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data customer contact',
=======
      message: "Data customer contact berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contact by ID:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data customer contact",
>>>>>>> main
    });
  }
}

<<<<<<< HEAD
export async function getCustomerContactsByCustomerId(
  req: Request,
  res: Response
): Promise<void> {
=======
export async function getCustomerContactsByCustomerId(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const { customerId } = req.params;

    if (!customerId) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'ID customer diperlukan',
=======
        message: "ID customer diperlukan",
>>>>>>> main
      });
      return;
    }

    const contacts = await getCustomerContactsByCustomerIdService(customerId);

    res.status(200).json({
      success: true,
      data: contacts,
<<<<<<< HEAD
      message: 'Data customer contacts berhasil diambil',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error fetching customer contacts by customer ID:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data customer contacts',
=======
      message: "Data customer contacts berhasil diambil",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching customer contacts by customer ID:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data customer contacts",
>>>>>>> main
    });
  }
}

<<<<<<< HEAD
export async function createCustomerContact(
  req: Request,
  res: Response
): Promise<void> {
=======
export async function createCustomerContact(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const contactData = req.body;

    // Validasi data
    const validation = validateCustomerContactData(contactData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'Data tidak valid',
=======
        message: "Data tidak valid",
>>>>>>> main
        errors: validation.errors,
      });
      return;
    }

    const newContact = await createCustomerContactService(contactData);

    res.status(201).json({
      success: true,
      data: newContact,
<<<<<<< HEAD
      message: 'Customer contact berhasil dibuat',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer contact:', error);

    // Handle foreign key constraint error
    if (
      error instanceof Error &&
      error.message.includes('Foreign key constraint')
    ) {
      res.status(400).json({
        success: false,
        message: 'Customer dengan ID tersebut tidak ditemukan',
=======
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
>>>>>>> main
      });
      return;
    }

    res.status(500).json({
      success: false,
<<<<<<< HEAD
      message: 'Terjadi kesalahan saat membuat customer contact',
=======
      message: "Terjadi kesalahan saat membuat customer contact",
>>>>>>> main
    });
  }
}

<<<<<<< HEAD
export async function createCustomerContactForCustomer(
  req: Request,
  res: Response
): Promise<void> {
=======
export async function createCustomerContactForCustomer(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const { customerId } = req.params;
    const contactData = req.body;

    if (!customerId) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'ID customer diperlukan',
=======
        message: "ID customer diperlukan",
>>>>>>> main
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
<<<<<<< HEAD
        message: 'Data tidak valid',
=======
        message: "Data tidak valid",
>>>>>>> main
        errors: validation.errors,
      });
      return;
    }

<<<<<<< HEAD
    const newContact = await createCustomerContactService(
      contactWithCustomerId
    );
=======
    const newContact = await createCustomerContactService(contactWithCustomerId);
>>>>>>> main

    res.status(201).json({
      success: true,
      data: newContact,
<<<<<<< HEAD
      message: 'Customer contact berhasil dibuat',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer contact for customer:', error);

    // Handle foreign key constraint error
    if (
      error instanceof Error &&
      error.message.includes('Foreign key constraint')
    ) {
      res.status(400).json({
        success: false,
        message: 'Customer dengan ID tersebut tidak ditemukan',
=======
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
>>>>>>> main
      });
      return;
    }

    res.status(500).json({
      success: false,
<<<<<<< HEAD
      message: 'Terjadi kesalahan saat membuat customer contact',
=======
      message: "Terjadi kesalahan saat membuat customer contact",
>>>>>>> main
    });
  }
}

<<<<<<< HEAD
export async function updateCustomerContact(
  req: Request,
  res: Response
): Promise<void> {
=======
export async function updateCustomerContact(req: Request, res: Response): Promise<void> {
>>>>>>> main
  try {
    const { id } = req.params;
    const contactData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'ID customer contact diperlukan',
=======
        message: "ID customer contact diperlukan",
>>>>>>> main
      });
      return;
    }

    // Validasi data (untuk update, semua field bersifat opsional)
    const validation = validateCustomerContactData(contactData, true);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: 'Data tidak valid',
=======
        message: "Data tidak valid",
>>>>>>> main
        errors: validation.errors,
      });
      return;
    }

    const updatedContact = await updateCustomerContactService(id, contactData);

    if (!updatedContact) {
      res.status(404).json({
        success: false,
<<<<<<< HEAD
        message: 'Customer contact tidak ditemukan',
=======
        message: "Customer contact tidak ditemukan",
>>>>>>> main
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedContact,
<<<<<<< HEAD
      message: 'Customer contact berhasil diperbarui',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error updating customer contact:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui customer contact',
=======
      message: "Customer contact berhasil diperbarui",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error updating customer contact:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui customer contact",
>>>>>>> main
    });
  }
}

<<<<<<< HEAD
export async function deleteCustomerContact(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'ID customer contact diperlukan',
=======
export async function deleteCustomerContact(req: Request, res: Response): Promise<void> {
  try {
    // Support both /:id and /:customerId/contacts/:contactId routes
    const contactId = req.params.contactId || req.params.id;

    if (!contactId) {
      res.status(400).json({
        success: false,
        message: "ID customer contact diperlukan",
>>>>>>> main
      });
      return;
    }

<<<<<<< HEAD
    const deleted = await deleteCustomerContactService(id);
=======
    const deleted = await deleteCustomerContactService(contactId);
>>>>>>> main

    if (!deleted) {
      res.status(404).json({
        success: false,
<<<<<<< HEAD
        message: 'Customer contact tidak ditemukan',
=======
        message: "Customer contact tidak ditemukan",
>>>>>>> main
      });
      return;
    }

    res.status(200).json({
      success: true,
<<<<<<< HEAD
      message: 'Customer contact berhasil dihapus',
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error deleting customer contact:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus customer contact',
=======
      message: "Customer contact berhasil dihapus",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error deleting customer contact:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus customer contact",
>>>>>>> main
    });
  }
}
