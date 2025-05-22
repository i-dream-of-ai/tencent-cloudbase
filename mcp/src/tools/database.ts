import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'


// 云开发数据库集合相关的类型定义
type CreateIndexOption = {
  IndexName: string;
  MgoKeySchema: {
    MgoIsUnique: boolean;
    MgoIndexKeys: Array<{
      Name: string;
      Direction: string;
    }>;
  };
};

type DropIndexOption = {
  IndexName: string;
};

type UpdateCollectionOption = {
  CreateIndexes?: CreateIndexOption[];
  DropIndexes?: DropIndexOption[];
};

// 获取数据库实例ID
async function getDatabaseInstanceId() {
  const cloudbase = await getCloudBaseManager()
  const { EnvInfo } = await cloudbase.env.getEnvInfo();
  if (!EnvInfo?.Databases?.[0]?.InstanceId) {
    throw new Error("无法获取数据库实例ID");
  }
  return EnvInfo.Databases[0].InstanceId;
}

export function registerDatabaseTools(server: McpServer) {
  // 创建云开发数据库集合
  server.tool(
    "createCollection",
    "创建一个新的云开发数据库集合",
    {
      collectionName: z.string().describe("云开发数据库集合名称")
    },
    async ({ collectionName }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.createCollection(collectionName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                message: "云开发数据库集合创建成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "云开发数据库集合创建失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 检查云开发数据库集合是否存在
  server.tool(
    "checkCollectionExists",
    "检查云开发数据库集合是否存在",
    {
      collectionName: z.string().describe("云开发数据库集合名称")
    },
    async ({ collectionName }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.checkCollectionExists(collectionName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                exists: result.Exists,
                requestId: result.RequestId,
                message: result.Exists ? "云开发数据库集合已存在" : "云开发数据库集合不存在"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "检查云开发数据库集合失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // // 删除云开发数据库集合
  // server.tool(
  //   "deleteCollection",
  //   "删除一个云开发数据库集合",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称")
  //   },
  //   async ({ collectionName }) => {
  //     try {
  //       const result = await cloudbase.database.deleteCollection(collectionName);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               exists: result.Exists,
  //               message: "云开发数据库集合删除成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "云开发数据库集合删除失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // 更新云开发数据库集合（创建/删除索引）
  server.tool(
    "updateCollection",
    "更新云开发数据库集合配置（创建或删除索引）",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      options: z.object({
        CreateIndexes: z.array(z.object({
          IndexName: z.string(),
          MgoKeySchema: z.object({
            MgoIsUnique: z.boolean(),
            MgoIndexKeys: z.array(z.object({
              Name: z.string(),
              Direction: z.string()
            }))
          })
        })).optional(),
        DropIndexes: z.array(z.object({
          IndexName: z.string()
        })).optional()
      }).describe("更新选项，支持创建和删除索引")
    },
    async ({ collectionName, options }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.updateCollection(collectionName, options);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                message: "云开发数据库集合更新成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "云开发数据库集合更新失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 查询云开发数据库集合详情
  server.tool(
    "describeCollection",
    "获取云开发数据库集合的详细信息",
    {
      collectionName: z.string().describe("云开发数据库集合名称")
    },
    async ({ collectionName }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.describeCollection(collectionName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                indexNum: result.IndexNum,
                indexes: result.Indexes,
                message: "获取云开发数据库集合信息成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "获取云开发数据库集合信息失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 获取云开发数据库集合列表
  server.tool(
    "listCollections",
    "获取云开发数据库集合列表",
    {
      offset: z.number().optional().describe("偏移量"),
      limit: z.number().optional().describe("返回数量限制")
    },
    async ({ offset, limit }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.listCollections({
          MgoOffset: offset,
          MgoLimit: limit
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                collections: result.Collections,
                pager: result.Pager,
                message: "获取云开发数据库集合列表成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "获取云开发数据库集合列表失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 检查索引是否存在
  server.tool(
    "checkIndexExists",
    "检查索引是否存在",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      indexName: z.string().describe("索引名称")
    },
    async ({ collectionName, indexName }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.checkIndexExists(collectionName, indexName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                exists: result.Exists,
                requestId: result.RequestId,
                message: result.Exists ? "索引已存在" : "索引不存在"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "检查索引失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // // 导入数据
  // server.tool(
  //   "importData",
  //   "导入数据到云开发数据库集合中",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称"),
  //     file: z.object({
  //       ObjectKey: z.string().optional().describe("对象存储中的文件路径"),
  //       FilePath: z.string().optional().describe("本地文件路径")
  //     }).describe("导入文件信息"),
  //     options: z.object({
  //       FileType: z.enum(["csv", "json"]).optional().describe("文件类型"),
  //       StopOnError: z.boolean().optional().describe("遇到错误时是否停止导入"),
  //       ConflictMode: z.enum(["insert", "upsert"]).optional().describe("冲突处理方式")
  //     }).optional().describe("导入选项")
  //   },
  //   async ({ collectionName, file, options }) => {
  //     try {
  //       const result = await cloudbase.database.import(collectionName, file, options);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               jobId: result.JobId,
  //               message: "数据导入任务创建成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "数据导入任务创建失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // // 导出数据
  // server.tool(
  //   "exportData",
  //   "从云开发数据库集合中导出数据",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称"),
  //     file: z.object({
  //       ObjectKey: z.string().describe("导出到对象存储的文件路径")
  //     }).describe("导出文件信息"),
  //     options: z.object({
  //       FileType: z.enum(["csv", "json"]).optional().describe("文件类型"),
  //       Query: z.string().optional().describe("查询条件（JSON字符串）"),
  //       Sort: z.string().optional().describe("排序条件（JSON字符串）"),
  //       Skip: z.number().optional().describe("跳过的记录数"),
  //       Limit: z.number().optional().describe("限制返回的记录数"),
  //       Fields: z.string().optional().describe("导出字段列表，以逗号分隔")
  //     }).optional().describe("导出选项")
  //   },
  //   async ({ collectionName, file, options }) => {
  //     try {
  //       const result = await cloudbase.database.export(collectionName, file, options);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               jobId: result.JobId,
  //               message: "数据导出任务创建成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "数据导出任务创建失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // // 查询迁移状态
  // server.tool(
  //   "migrateStatus",
  //   "查询数据迁移（导入/导出）任务的状态",
  //   {
  //     jobId: z.number().describe("任务ID")
  //   },
  //   async ({ jobId }) => {
  //     try {
  //       const result = await cloudbase.database.migrateStatus(jobId);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               status: result.Status,
  //               recordSuccess: result.RecordSuccess,
  //               recordFail: result.RecordFail,
  //               errorMsg: result.ErrorMsg,
  //               fileUrl: result.FileUrl,
  //               message: "获取迁移状态成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "获取迁移状态失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // 查询数据分布
  server.tool(
    "distribution",
    "查询数据库中云开发数据库集合的数据分布情况",
    {},
    async () => {
      try {
        const cloudbase = await getCloudBaseManager()
        const result = await cloudbase.database.distribution();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                collections: result.Collections,
                message: "获取数据分布成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "获取数据分布失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 插入文档
  server.tool(
    "insertDocuments",
    "向云开发数据库集合中插入一个或多个文档",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      documents: z.array(z.string()).describe("要插入的文档JSON 字符串数组，每个文档都是 JSON字符串，注意不是JSON对象")
    },
    async ({ collectionName, documents }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const instanceId = await getDatabaseInstanceId();

        const result = await cloudbase.commonService('flexdb').call({
          Action: 'PutItem',
          Param: {
            TableName: collectionName,
            MgoDocs: documents,
            Tag: instanceId
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                insertedIds: result.InsertedIds,
                message: "文档插入成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文档插入失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 查询文档
  server.tool(
    "queryDocuments",
    "查询云开发数据库集合中的文档",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      query: z.string().optional().describe("查询条件（JSON字符串）"),
      projection: z.string().optional().describe("返回字段投影（JSON字符串）"),
      sort: z.string().optional().describe("排序条件（JSON字符串）"),
      limit: z.number().optional().describe("返回数量限制"),
      offset: z.number().optional().describe("跳过的记录数")
    },
    async ({ collectionName, query, projection, sort, limit, offset }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const instanceId = await getDatabaseInstanceId();

        const result = await cloudbase.commonService('flexdb').call({
          Action: 'Query',
          Param: {
            TableName: collectionName,
            MgoQuery: query,
            MgoProjection: projection,
            MgoSort: sort,
            MgoLimit: limit,
            MgoOffset: offset,
            Tag: instanceId
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                data: result.Data,
                pager: result.Pager,
                message: "文档查询成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文档查询失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 更新文档
  server.tool(
    "updateDocuments",
    "更新云开发数据库集合中的文档",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      query: z.string().describe("查询条件（JSON字符串）"),
      update: z.string().describe("更新内容（JSON字符串）"),
      isMulti: z.boolean().optional().describe("是否更新多条记录"),
      upsert: z.boolean().optional().describe("是否在不存在时插入")
    },
    async ({ collectionName, query, update, isMulti, upsert }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const instanceId = await getDatabaseInstanceId();

        const result = await cloudbase.commonService('flexdb').call({
          Action: 'UpdateItem',
          Param: {
            TableName: collectionName,
            MgoQuery: query,
            MgoUpdate: update,
            MgoIsMulti: isMulti,
            MgoUpsert: upsert,
            Tag: instanceId
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                modifiedCount: result.ModifiedNum,
                matchedCount: result.MatchedNum,
                upsertedId: result.UpsertedId,
                message: "文档更新成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文档更新失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 删除文档
  server.tool(
    "deleteDocuments",
    "删除云开发数据库集合中的文档",
    {
      collectionName: z.string().describe("云开发数据库集合名称"),
      query: z.string().describe("查询条件（JSON字符串）"),
      isMulti: z.boolean().optional().describe("是否删除多条记录")
    },
    async ({ collectionName, query, isMulti }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const instanceId = await getDatabaseInstanceId();

        const result = await cloudbase.commonService('flexdb').call({
          Action: 'DeleteItem',
          Param: {
            TableName: collectionName,
            MgoQuery: query,
            MgoIsMulti: isMulti,
            Tag: instanceId
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                deleted: result.Deleted,
                message: "文档删除成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文档删除失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );
} 