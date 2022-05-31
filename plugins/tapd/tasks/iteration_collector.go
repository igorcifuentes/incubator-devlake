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
	"encoding/json"
	"fmt"
	"github.com/apache/incubator-devlake/plugins/core"
	"github.com/apache/incubator-devlake/plugins/helper"
	"github.com/apache/incubator-devlake/plugins/tapd/models"
	"net/http"
	"net/url"
	"time"
)

const RAW_ITERATION_TABLE = "tapd_api_iterations"

var _ core.SubTaskEntryPoint = CollectIterations

func CollectIterations(taskCtx core.SubTaskContext) error {
	data := taskCtx.GetData().(*TapdTaskData)
	db := taskCtx.GetDb()
	logger := taskCtx.GetLogger()
	logger.Info("collect iterations")
	since := data.Since
	incremental := false
	if since == nil {
		// user didn't specify a time range to sync, try load from database
		var latestUpdated models.TapdIteration
		err := db.Where("connection_id = ?", data.Connection.ID).Order("modified DESC").Limit(1).Find(&latestUpdated).Error
		if err != nil {
			return fmt.Errorf("failed to get latest tapd changelog record: %w", err)
		}
		if latestUpdated.ID > 0 {
			since = (*time.Time)(latestUpdated.Modified)
			incremental = true
		}
	}
	collector, err := helper.NewApiCollector(helper.ApiCollectorArgs{
		RawDataSubTaskArgs: helper.RawDataSubTaskArgs{
			Ctx: taskCtx,
			Params: TapdApiParams{
				ConnectionId: data.Connection.ID,
				//CompanyId: data.Options.CompanyId,
				WorkspaceID: data.Options.WorkspaceID,
			},
			Table: RAW_ITERATION_TABLE,
		},
		Incremental: incremental,
		ApiClient:   data.ApiClient,
		PageSize:    100,
		UrlTemplate: "iterations",
		Query: func(reqData *helper.RequestData) (url.Values, error) {
			query := url.Values{}
			query.Set("workspace_id", fmt.Sprintf("%v", data.Options.WorkspaceID))
			query.Set("page", fmt.Sprintf("%v", reqData.Pager.Page))
			query.Set("limit", fmt.Sprintf("%v", reqData.Pager.Size))
			query.Set("order", "created asc")
			if since != nil {
				query.Set("updated", fmt.Sprintf(">%v", since.Format("YYYY-MM-DD")))
			}
			return query, nil
		},
		ResponseParser: func(res *http.Response) ([]json.RawMessage, error) {
			var data struct {
				Iterations []json.RawMessage `json:"data"`
			}
			err := helper.UnmarshalResponse(res, &data)
			return data.Iterations, err
		},
	})
	if err != nil {
		logger.Error("collect iteration error:", err)
		return err
	}
	return collector.Execute()
}

var CollectIterationMeta = core.SubTaskMeta{
	Name:        "collectIterations",
	EntryPoint:  CollectIterations,
	Required:    true,
	Description: "collect Tapd iterations",
}