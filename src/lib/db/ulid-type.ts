import { customType } from "drizzle-orm/pg-core";
import { ulid as genUlid, ulidToUUID, uuidToULID } from "ulid";

export { genUlid };

export const ulidType = customType<{ data: string; driverData: string }>({
  dataType() {
    return "uuid";
  },
  toDriver(data: string): string {
    return ulidToUUID(data);
  },
  fromDriver(driverData: string): string {
    return uuidToULID(driverData);
  },
});
