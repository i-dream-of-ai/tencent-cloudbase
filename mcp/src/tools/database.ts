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
  // 统一的集合管理工具
  server.tool(
    "manageCollection",
    "统一的云开发数据库集合管理工具，支持创建、检查、描述、列表、更新集合操作",
    {
      action: z.enum(["create", "check", "describe", "list", "update"]).describe("操作类型: create=创建集合, check=检查集合是否存在, describe=获取集合详情, list=获取集合列表, update=更新集合配置"),
      collectionName: z.string().optional().describe("集合名称（create、check、describe、update操作必需）"),
      // list操作参数
      offset: z.number().optional().describe("偏移量（list操作使用）"),
      limit: z.number().optional().describe("返回数量限制（list操作使用）"),
      // update操作参数
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
      }).optional().describe("更新选项，支持创建和删除索引（update操作使用）")
    },
    async ({ action, collectionName, offset, limit, options }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        let result;

        switch (action) {
          case "create":
            if (!collectionName) {
              throw new Error("创建集合需要提供collectionName参数");
            }
            result = await cloudbase.database.createCollection(collectionName);
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

          case "check":
            if (!collectionName) {
              throw new Error("检查集合需要提供collectionName参数");
            }
            result = await cloudbase.database.checkCollectionExists(collectionName);
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

          case "describe":
            if (!collectionName) {
              throw new Error("获取集合详情需要提供collectionName参数");
            }
            result = await cloudbase.database.describeCollection(collectionName);
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

          case "list":
            result = await cloudbase.database.listCollections({
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

          case "update":
            if (!collectionName || !options) {
              throw new Error("更新集合需要提供collectionName和options参数");
            }
            result = await cloudbase.database.updateCollection(collectionName, options);
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

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: `云开发数据库集合${action}操作失败`
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

  // 统一的文档操作工具
  server.tool(
    "manageDocuments",
    "统一的云开发数据库文档管理工具，支持插入、查询、更新、删除文档操作",
    {
      action: z.enum(["insert", "query", "update", "delete"]).describe("操作类型: insert=插入文档, query=查询文档, update=更新文档, delete=删除文档"),
      collectionName: z.string().describe("云开发数据库集合名称"),
      // insert操作参数
      documents: z.array(z.string()).optional().describe("要插入的文档JSON字符串数组（insert操作必需）"),
      // query操作参数
      query: z.string().optional().describe("查询条件JSON字符串（query、update、delete操作使用）"),
      projection: z.string().optional().describe("返回字段投影JSON字符串（query操作使用）"),
      sort: z.string().optional().describe("排序条件JSON字符串（query操作使用）"),
      limit: z.number().optional().describe("返回数量限制（query操作使用）"),
      offset: z.number().optional().describe("跳过的记录数（query操作使用）"),
      // update操作参数
      update: z.string().optional().describe("更新内容JSON字符串（update操作必需）"),
      isMulti: z.boolean().optional().describe("是否更新/删除多条记录（update、delete操作使用）"),
      upsert: z.boolean().optional().describe("是否在不存在时插入（update操作使用）")
    },
    async ({ action, collectionName, documents, query, projection, sort, limit, offset, update, isMulti, upsert }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        const instanceId = await getDatabaseInstanceId();
        let result;

        switch (action) {
          case "insert":
            if (!documents || documents.length === 0) {
              throw new Error("插入文档需要提供documents参数");
            }
            result = await cloudbase.commonService('flexdb').call({
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

          case "query":
            result = await cloudbase.commonService('flexdb').call({
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

          case "update":
            if (!query || !update) {
              throw new Error("更新文档需要提供query和update参数");
            }
            result = await cloudbase.commonService('flexdb').call({
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

          case "delete":
            if (!query) {
              throw new Error("删除文档需要提供query参数");
            }
            result = await cloudbase.commonService('flexdb').call({
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

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: `文档${action}操作失败`
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
}