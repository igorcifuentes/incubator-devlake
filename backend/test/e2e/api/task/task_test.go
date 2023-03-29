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

package task

import (
	"encoding/json"
	"github.com/apache/incubator-devlake/core/errors"
	"github.com/apache/incubator-devlake/core/models"
	"github.com/apache/incubator-devlake/server/api"
	_ "github.com/apache/incubator-devlake/test/e2e"
	"github.com/gin-gonic/gin"
	"github.com/magiconair/properties/assert"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNewTask(t *testing.T) {
	r := gin.Default()
	api.RegisterRouter(r)

	w := httptest.NewRecorder()
	params := strings.NewReader(`{"name": "hello", "plan": [[{ "plugin": "jira", "options": { "host": "www.jira.com" } }]]}`)
	req, _ := http.NewRequest("POST", "/pipelines", params)
	r.ServeHTTP(w, req)

	assert.Equal(t, w.Code, http.StatusCreated)
	resp := w.Body.String()
	var pipeline models.Pipeline
	err := errors.Convert(json.Unmarshal([]byte(resp), &pipeline))
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, pipeline.Name, "hello")

	var tasks [][]*models.NewTask
	err = errors.Convert(json.Unmarshal(pipeline.Plan, &tasks))
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, tasks[0][0].Plugin, "jira")
}
