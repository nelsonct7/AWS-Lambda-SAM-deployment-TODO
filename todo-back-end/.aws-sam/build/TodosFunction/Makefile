.PHONY: build package deploy local clean

build:
	npm install
	npx tsc

package:
	sam package \
		--s3-bucket $(S3_BUCKET) \
		--output-template-file packaged.yaml

deploy:
	sam deploy \
		--template-file packaged.yaml \
		--stack-name todo-api \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			MongoDbUri=$(MONGODB_URI) \
			JwtSecret=$(JWT_SECRET)

local:
	sam local start-api --env-vars env.json

env:
	@echo "Creating env.json for local testing..."
	@echo '{"AuthFunction": {"MONGODB_URI": "$(MONGODB_URI)", "JWT_SECRET": "$(JWT_SECRET)"}, "TodosFunction": {"MONGODB_URI": "$(MONGODB_URI)", "JWT_SECRET": "$(JWT_SECRET)"}}' > env.json

clean:
	rm -rf dist packaged.yaml env.json
