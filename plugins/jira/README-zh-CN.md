# Jira 插件

<div align="center">

| [English](README.md) | [中文](README-zh-CN.md) |
| --- | --- |

</div>

<br>

## 概述

此插件通过 Jira Cloud REST API 收集 Jira 数据。然后，它从 Jira 数据中计算出各种工程指标并使之可视化。

<img width="2035" alt="Screen Shot 2021-09-10 at 4 01 55 PM" src="https://user-images.githubusercontent.com/2908155/132926143-7a31d37f-22e1-487d-92a3-cf62e402e5a8.png">

## Project Metrics This Covers

指标名称 | 描述
:------------ | :-------------
需求数 | 类型为 "需求" 的事务的数量
需求交付时间 | 类型为 "需求" 的事务的交付时间，即从创建到完成的时间
需求交付率 | 已交付的需求/所有需求的比率
需求粒度 | 一个"需求"类型事务的标准故事点
故障数量 | 类型为 "故障" 的事务数量<br><i>测试中发现的Bug</i>。
故障修复时间 |类型为 "故障" 的事务的修复时间
测试故障率（代码行） | 每1000行代码产生的 "故障" 数量<br><i>包括新增和删除的行数</i>
测试故障数 | 类型为 "故障" 的事务数量<br><i>Incident在生产中运行时发现的问题</i>。
质量事故数 | "Incident" 类型的事务的准备时间
质量事故率（代码行） | 每1000行代码产生的 Incident 数量<br><i>包括新增和删除的行数</i>

## 配置

插件运行前，需要在Dev Lake提供的config UI中完成插件设置。在浏览器中打开 `config-ui`，默认的网址是 `http://localhost:4000`，然后打开 **Data Integrations / JIRA** 页面。JIRA 插件目前支持多数据源，在设置页面中您可以添加新的连接，以及修改现有连接的设定。

针对每个连接，你需要设定以下条目：

- Connection Name: 连接的名称，用以区别不同的数据源。
- Endpoint URL: JIRA 实例的 api 网址，如果您使用的是 JIRA 云服务，它的格式为 `https://<mydomain>.atlassian.net/rest`。devlake 主要支持托管在 atlassian.net 上的 JIRA 云服务 API，如果您使用的是 Server 版，可能会出现无法使用的情况。
- Basic Auth Token: 首先，在 JIRA 的面板上为您的账号生成一个 **JIRA API TOKEN** (参见 [生成 API Token](#生成-api-token)), 然后，在 `config-ui` 中点击文本框右边的钥匙图标，输入相应的帐号和Token，点击 Generate 即可为您生成所需的 **Basic Auth Token**
- Issue Type Mapping:  JIRA 是高度可定制的，因此，每个 JIRA 实例 可以有一套完全不同于其它实例的 Issue Type。为了能正确地计算并展示各种指标，您必须将自定义的 Issue Type 映射到系统的标准类型。请参照 [事务类型映射](#事务类型映射) 进行设定。
- Epic Key: 在 JIRA 中， issue 和 epic 的关联是通过 `customfield` 实现的，因此这个字段的名称在不同的实例上是不一样的。需要手动指定，请参照 [查找自定义字段的名称](#查找自定义字段名称) 进行设定。
- Story Point Field: 同上，
- Remotelink Commit SHA: 一个对commit链接进行匹配的正则表达式，用于判断一个外部链接是否为指向commit的链接。以gitlab为例，要匹配所有类似于https://gitlab.com/merico-dev/ce/example-repository/-/commit/8ab8fb319930dbd8615830276444b8545fd0ad24 这样的commit 可以直接使用正则表达式 **/commit/([0-9a-f]{40})$**
### 生成 API Token

1. 登录Jira后，访问网址 `https://id.atlassian.com/manage-profile/security/api-tokens`
2. 点击 **Create API Token** 按钮，随便取个标签名
![image](https://user-images.githubusercontent.com/27032263/129363611-af5077c9-7a27-474a-a685-4ad52366608b.png)


### 事务类型映射

Devlake 支持三种标准类型，所有的指标将会基于标准类型进行计算：

 - `故障（Bug）`: 在 **测试阶段** 发现的缺陷，未被部署到生产环境中。
 - `事故（Incident）`: 在 **生产环境** 中发现的缺陷。
 - `需求（Requirement）`: 如果您采用了 SCRUM 开发过程，它一般是对应到 `Story` 类型。

您可以映射任意数量的 **自定义类型** 到某一特定的 **标准类型**，举例来说，一般我们会把 `Story` 映射到 `Requirement`, 但取于具体场景，您也可以选择同时把 `Story` 和 `Task` 都映射到 `Requirement`。对于未做指定的类型，转换器会采用原始的 **自定义类型** 来填充 **标准类型** 字段，因此，像 "将 Bug 映射 到 Bug" 这种操作是不需要的。

事务类型映射对于一些指标来说是至关重要的，比如**需求数**，请确保正确映射你的自定义类型。

## 查找自定义字段的名称

请遵循此指南，[如何查找 Jira 的自定义字段的ID?](https://github.com/merico-dev/lake/wiki/How-to-find-the-custom-field-ID-in-Jira)

## 数据收集及计算

为了触发插件进行数据收集和计算，您需要构造一个 JSON， 通过 `config-ui` 中的 `Triggers` 功能，发送请求触发收集计算任务：
<font color=“red”>警告：数据收集只支持单任务执行，多任务并发执行的结果可能达不到预期。</font>

```json
[
  [
    {
      "plugin": "jira",
      "options": {
        "sourceId": 1,
        "boardId": 8,
        "since": "2006-01-02T15:04:05Z"
      }
    }
  ]
]
```
- `sourceId`: 数据源的 ID, 即 **JIRA Integration** 中 Connection 表中的ID列。
- `boardId`: JIRA board id, 请参照 [Find如何获取 Jira Board IdBoard Id](#如何获取-jira-board-id)。
- `since`: 可选, 仅同步指定日期后有变化的数据。

Board Id 在具体触发时候指定即可，不需要在数据源连接级别进行配置。

### 如何获取 Jira Board Id
1. 打开浏览器，进入待导入的 Jira 面板
2. 在 URL 的参数 `?rapidView=` 中获取面板 ID


例如: 对于 `https://<your_jira_endpoint>/secure/RapidBoard.jspa?rapidView=39`，面板的ID是39

![Screen Shot 2021-08-13 at 10 07 19 AM](https://user-images.githubusercontent.com/27032263/129363083-df0afa18-e147-4612-baf9-d284a8bb7a59.png)

## API

### 数据源(Connection) 管理

#### 数据源

- 获取所有数据源
```
GET /plugins/jira/sources


[
  {
    "ID": 14,
    "CreatedAt": "2021-10-11T11:49:19.029Z",
    "UpdatedAt": "2021-10-11T11:49:19.029Z",
    "name": "test-jira-source",
    "endpoint": "https://merico.atlassian.net/rest",
    "basicAuthEncoded": "basicAuth",
    "epicKeyField": "epicKeyField",
    "storyPointField": "storyPointField",
  }
]
```
- 创建所有数据源
```
POST /plugins/jira/sources
{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type"
		}
	}
}
```
- 更新数据源
```
PUT /plugins/jira/sources/:sourceId
{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type",
		}
	}
}
```
- 获取指定数据源的详细信息
```
GET /plugins/jira/sources/:sourceId


{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type",
		}
	}
}
```
- 删除数据源
```
DELETE /plugins/jira/sources/:sourceId
```

#### 事务类型映射

- 获取数据源的所有类型映射
```
GET /plugins/jira/sources/:sourceId/type-mappings


[
  {
    "jiraSourceId": 16,
    "userType": "userType",
    "standardType": "standardType"
  }
]
```
- 给数据源添加一个新的类型映射
```
POST /plugins/jira/sources/:sourceId/type-mappings
{
    "userType": "userType",
    "standardType": "standardType"
}
```
- 更新类型映射
```
PUT /plugins/jira/sources/:sourceId/type-mapping/:userType
{
    "standardType": "standardTypeUpdated"
}
```
- 删除类型映射
```
DELETE /plugins/jira/sources/:sourceId/type-mapping/:userType
```
- JIRA API 代理
```
GET /plugins/jira/sources/:sourceId/proxy/rest/*path

For example:
Requests to http://your_devlake_host/plugins/jira/sources/1/proxy/rest/agile/1.0/board/8/sprint
would forward to
https://your_jira_host/rest/agile/1.0/board/8/sprint

{
    "maxResults": 1,
    "startAt": 0,
    "isLast": false,
    "values": [
        {
            "id": 7,
            "self": "https://merico.atlassian.net/rest/agile/1.0/sprint/7",
            "state": "closed",
            "name": "EE Sprint 7",
            "startDate": "2020-06-12T00:38:51.882Z",
            "endDate": "2020-06-26T00:38:00.000Z",
            "completeDate": "2020-06-22T05:59:58.980Z",
            "originBoardId": 8,
            "goal": ""
        }
    ]
}
```