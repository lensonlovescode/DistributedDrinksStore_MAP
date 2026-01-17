import express from 'express';
import Branch from '../models/Branch.js';

const router = express.Router();

// Create branch
router.post('/create', async (req, res) => {
  try {
    const { name, location, isHeadquarter } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    const branch = new Branch({ name, location, isHeadquarter: isHeadquarter || false });
    await branch.save();

    res.status(201).json({ message: 'Branch created', branch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all branches
router.get('/all', async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branch by ID
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update branch
router.patch('/:id', async (req, res) => {
  try {
    const { name, location, isHeadquarter } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, location, isHeadquarter },
      { new: true }
    );
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json({ message: 'Branch updated', branch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete branch
router.delete('/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
