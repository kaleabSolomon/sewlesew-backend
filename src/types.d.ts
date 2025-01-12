import { userReq } from './common/types'; // Adjust the path as necessary

declare global {
  namespace Express {
    interface Request {
      user: userReq;
    }
  }
}
