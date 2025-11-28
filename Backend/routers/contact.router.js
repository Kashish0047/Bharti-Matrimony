import express from 'express';
import { Router } from 'express';
import {createContact,getAllContacts, deleteContact} from '../controllers/contact.controller.js';

const router = Router();

router.post('/', createContact);
router.get('/', getAllContacts);
router.delete("/:id", deleteContact);

export default router;