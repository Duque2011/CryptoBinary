import { models } from "@b/db";
import { CacheManager } from "@b/utils/cache";

export const metadata = {
  summary: "Updates application settings",
  operationId: "updateApplicationSettings",
  tags: ["Admin", "Settings"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            data: {
              type: "object",
              description: "Settings data to update",
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Settings updated successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description:
                  "Confirmation message indicating successful update",
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized, admin permission required",
    },
    500: {
      description: "Internal server error",
    },
  },
  permission: "Access System Settings Management",
  requiresAuth: true,
};

export default async (data: { body: { [key: string]: unknown } }) => {
  const { body } = data;

  const existingSettings = await models.settings.findAll();
  const existingKeys = existingSettings.map((setting) => setting.key);

  const updates = Object.entries(body)
    .filter(([_, value]) => value !== null && value !== "null")
    .map(async ([key, value]) => {
      if (existingKeys.includes(key)) {
        return models.settings.update(
          { value: String(value) },
          { where: { key } }
        );
      } else {
        return models.settings.create({ key, value: String(value) });
      }
    });

  await Promise.all(updates);

  // Remove null or "null" values
  const keysToRemove = Object.entries(body)
    .filter(([_, value]) => value === null || value === "null")
    .map(([key, _]) => key);

  if (keysToRemove.length > 0) {
    await models.settings.destroy({
      where: {
        key: keysToRemove,
      },
    });
  }

  // Clear cache to reflect updated settings
  const cacheManager = CacheManager.getInstance();
  await cacheManager.clearCache();
  return {
    message: "Settings updated successfully",
  };
};
