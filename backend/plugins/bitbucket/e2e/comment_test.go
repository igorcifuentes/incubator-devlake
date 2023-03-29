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

package e2e

import (
	"github.com/apache/incubator-devlake/core/models/domainlayer/code"
	"github.com/apache/incubator-devlake/core/models/domainlayer/ticket"
	"github.com/apache/incubator-devlake/helpers/e2ehelper"
	"github.com/apache/incubator-devlake/plugins/bitbucket/impl"
	"github.com/apache/incubator-devlake/plugins/bitbucket/models"
	"github.com/apache/incubator-devlake/plugins/bitbucket/tasks"
	"testing"
)

func TestCommentDataFlow(t *testing.T) {
	var plugin impl.Bitbucket
	dataflowTester := e2ehelper.NewDataFlowTester(t, "bitbucket", plugin)

	taskData := &tasks.BitbucketTaskData{
		Options: &tasks.BitbucketOptions{
			ConnectionId: 1,
			FullName:     "likyh/likyhphp",
			BitbucketTransformationRule: &models.BitbucketTransformationRule{
				IssueStatusTodo:       "new,open",
				IssueStatusInProgress: "on hold",
				IssueStatusDone:       "closed",
			},
		},
	}

	// import raw data table
	dataflowTester.ImportCsvIntoRawTable("./raw_tables/_raw_bitbucket_api_issue_comments.csv", "_raw_bitbucket_api_issue_comments")
	dataflowTester.ImportCsvIntoRawTable("./raw_tables/_raw_bitbucket_api_pullrequest_comments.csv", "_raw_bitbucket_api_pull_request_comments")

	// verify extraction
	dataflowTester.FlushTabler(&models.BitbucketIssueComment{})
	dataflowTester.FlushTabler(&models.BitbucketPrComment{})
	dataflowTester.FlushTabler(&models.BitbucketAccount{})
	dataflowTester.Subtask(tasks.ExtractApiIssueCommentsMeta, taskData)
	dataflowTester.Subtask(tasks.ExtractApiPrCommentsMeta, taskData)
	dataflowTester.VerifyTable(
		models.BitbucketIssueComment{},
		"./snapshot_tables/_tool_bitbucket_issue_comments.csv",
		e2ehelper.ColumnWithRawData(
			"connection_id",
			"bitbucket_id",
			"issue_id",
			"author_name",
			"author_id",
			"type",
		),
	)
	dataflowTester.VerifyTable(
		models.BitbucketPrComment{},
		"./snapshot_tables/_tool_bitbucket_pull_request_comments.csv",
		e2ehelper.ColumnWithRawData(
			"connection_id",
			"bitbucket_id",
			"pull_request_id",
			"author_name",
			"author_id",
			"type",
		),
	)
	dataflowTester.VerifyTable(
		models.BitbucketAccount{},
		"./snapshot_tables/_tool_bitbucket_accounts_in_comments.csv",
		e2ehelper.ColumnWithRawData(
			"connection_id",
			"user_name",
			"account_id",
			"account_status",
			"display_name",
			"avatar_url",
			"html_url",
			"uuid",
			"has2_fa_enabled",
		),
	)

	// verify comment conversion
	dataflowTester.FlushTabler(&ticket.IssueComment{})
	dataflowTester.FlushTabler(&code.PullRequestComment{})
	dataflowTester.Subtask(tasks.ConvertIssueCommentsMeta, taskData)
	dataflowTester.Subtask(tasks.ConvertPrCommentsMeta, taskData)

	dataflowTester.VerifyTable(
		ticket.IssueComment{},
		"./snapshot_tables/issue_comments.csv",
		e2ehelper.ColumnWithRawData(
			"id",
			"issue_id",
			"body",
			"account_id",
		),
	)

	// verify relation in pr and comment conversion
	dataflowTester.FlushTabler(&code.PullRequestComment{})
	dataflowTester.Subtask(tasks.ConvertPrCommentsMeta, taskData)
	dataflowTester.VerifyTable(
		code.PullRequestComment{},
		"./snapshot_tables/pull_request_comments.csv",
		e2ehelper.ColumnWithRawData(
			"id",
			"pull_request_id",
			"body",
			"account_id",
			"commit_sha",
			"position",
			"type",
			"review_id",
			"status",
		),
	)
}
