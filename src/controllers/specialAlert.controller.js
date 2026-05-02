import SpecialAlert from "../models/specialAlert.model.js";

export const createSpecialAlert = async (req, res) => {
    try {
        const { mealId, title, description, specialPrice, offerType, showOnTop } = req.body;
        const sellerId = req.user.id;
        const imageUrl = req.file ? req.file.path : null;

        const newAlert = new SpecialAlert({
            sellerId,
            mealId,
            title,
            description,
            specialPrice,
            offerType,
            showOnTop,
            image: imageUrl
        });

        await newAlert.save();
        res.status(201).json({ success: true, alert: newAlert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSellerSpecialAlerts = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const alerts = await SpecialAlert.find({ sellerId }).populate('mealId');
        res.status(200).json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllSpecialAlerts = async (req, res) => {
    try {
        const { city } = req.query;
        // If city is provided, we might need to join with User (seller) to filter by city
        let query = { isActive: true };
        
        let alerts;
        if (city) {
            alerts = await SpecialAlert.find(query)
                .populate({
                    path: 'sellerId',
                    match: { city: city }
                })
                .populate('mealId');
            
            // Filter out alerts where seller didn't match the city
            alerts = alerts.filter(alert => alert.sellerId !== null);
        } else {
            alerts = await SpecialAlert.find(query).populate('sellerId').populate('mealId');
        }

        res.status(200).json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSpecialAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = req.file.path;
        }
        const updatedAlert = await SpecialAlert.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ success: true, alert: updatedAlert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSpecialAlert = async (req, res) => {
    try {
        const { id } = req.params;
        await SpecialAlert.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Alert deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
