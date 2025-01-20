-- CreateIndex
CREATE INDEX `campaigns_businessId_charityId_idx` ON `campaigns`(`businessId`, `charityId`);

CREATE TRIGGER enforce_business_or_charity
BEFORE INSERT ON campaigns
FOR EACH ROW
BEGIN
  IF (NEW.businessId IS NOT NULL AND NEW.charityId IS NOT NULL) OR 
     (NEW.businessId IS NULL AND NEW.charityId IS NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Either businessId or charityId must be set, but not both.';
  END IF;
END;