/*
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package tasks

import (
	"github.com/apache/incubator-devlake/core/dal"
	"github.com/apache/incubator-devlake/core/errors"
	"github.com/apache/incubator-devlake/core/models/domainlayer"
	"github.com/apache/incubator-devlake/core/models/domainlayer/didgen"
	"github.com/apache/incubator-devlake/core/models/domainlayer/ticket"
	"github.com/apache/incubator-devlake/core/plugin"
	"github.com/apache/incubator-devlake/helpers/pluginhelper/api"
	"github.com/apache/incubator-devlake/plugins/zentao/models"
	"reflect"
	"strconv"
)

var _ plugin.SubTaskEntryPoint = ConvertStory

var ConvertStoryMeta = plugin.SubTaskMeta{
	Name:             "convertStory",
	EntryPoint:       ConvertStory,
	EnabledByDefault: true,
	Description:      "convert Zentao story",
	DomainTypes:      []string{plugin.DOMAIN_TYPE_TICKET},
}

func ConvertStory(taskCtx plugin.SubTaskContext) errors.Error {
	data := taskCtx.GetData().(*ZentaoTaskData)
	db := taskCtx.GetDal()
	storyIdGen := didgen.NewDomainIdGenerator(&models.ZentaoStory{})
	boardIdGen := didgen.NewDomainIdGenerator(&models.ZentaoProduct{})
	cursor, err := db.Cursor(
		dal.From(&models.ZentaoStory{}),
		dal.Where(`_tool_zentao_stories.product = ? and
			_tool_zentao_stories.connection_id = ?`, data.Options.ProductId, data.Options.ConnectionId),
	)
	if err != nil {
		return err
	}
	defer cursor.Close()
	convertor, err := api.NewDataConverter(api.DataConverterArgs{
		InputRowType: reflect.TypeOf(models.ZentaoStory{}),
		Input:        cursor,
		RawDataSubTaskArgs: api.RawDataSubTaskArgs{
			Ctx: taskCtx,
			Params: ZentaoApiParams{
				ConnectionId: data.Options.ConnectionId,
				ProductId:    data.Options.ProductId,
				ProjectId:    data.Options.ProjectId,
			},
			Table: RAW_STORY_TABLE,
		},
		Convert: func(inputRow interface{}) ([]interface{}, errors.Error) {
			toolEntity := inputRow.(*models.ZentaoStory)

			domainEntity := &ticket.Issue{
				DomainEntity: domainlayer.DomainEntity{
					Id: storyIdGen.Generate(toolEntity.ConnectionId, toolEntity.ID),
				},
				IssueKey:       strconv.FormatInt(toolEntity.ID, 10),
				Title:          toolEntity.Title,
				Type:           ticket.REQUIREMENT,
				OriginalType:   toolEntity.Type,
				OriginalStatus: toolEntity.Stage,
				ResolutionDate: toolEntity.ClosedDate.ToNullableTime(),
				CreatedDate:    toolEntity.OpenedDate.ToNullableTime(),
				UpdatedDate:    toolEntity.LastEditedDate.ToNullableTime(),
				ParentIssueId:  storyIdGen.Generate(data.Options.ConnectionId, toolEntity.Parent),
				Priority:       string(rune(toolEntity.Pri)),
				CreatorId:      strconv.FormatInt(toolEntity.OpenedById, 10),
				CreatorName:    toolEntity.OpenedByName,
				AssigneeId:     strconv.FormatInt(toolEntity.AssignedToId, 10),
				AssigneeName:   toolEntity.AssignedToName,
			}
			switch toolEntity.Stage {
			case "closed":
				domainEntity.Status = ticket.DONE
			case "wait":
				domainEntity.Status = ticket.TODO
			default:
				domainEntity.Status = ticket.IN_PROGRESS
			}
			if toolEntity.ClosedDate != nil {
				domainEntity.LeadTimeMinutes = int64(toolEntity.ClosedDate.ToNullableTime().Sub(toolEntity.OpenedDate.ToTime()).Minutes())
			}
			domainBoardIssue := &ticket.BoardIssue{
				BoardId: boardIdGen.Generate(data.Options.ConnectionId, data.Options.ProductId),
				IssueId: domainEntity.Id,
			}
			results := make([]interface{}, 0)
			results = append(results, domainEntity, domainBoardIssue)
			return results, nil
		},
	})

	if err != nil {
		return err
	}

	return convertor.Execute()
}
