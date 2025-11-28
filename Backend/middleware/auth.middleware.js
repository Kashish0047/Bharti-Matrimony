import jwt from 'jsonwebtoken';

const authMiddleware = async (req,res,next) => {
    try {
        const token = req.header('Authorization') ?.replace('Bearer ', '');

        if(!token){
            return res.status(401).json({
                message: "Access Denied. No token provided."
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.userId;

        next();

    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({
                message: "Invalid Token"
            });
        }
    }
}

export default authMiddleware;