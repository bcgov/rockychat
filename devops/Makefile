SHELL := /usr/bin/env bash

NAME := rockychat-devops
NAMESPACE =
IMAGE_TAG =

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml" \
	--set app.image.tag="${IMAGE_TAG}"
endef

.PHONY: check-image-tag
check-image-tag:
ifndef IMAGE_TAG
	$(error IMAGE_TAG is not set)
endif

.PHONY: helm-dep
helm-dep:
	helm dependency update

.PHONY: install
install: helm-dep
install: check-image-tag
install:
	@helm install $(call arguments)

.PHONY: upgrade
upgrade: helm-dep
upgrade: check-image-tag
upgrade:
	@helm upgrade --install $(call arguments)


.PHONY: lint
lint: helm-dep
lint:
	@helm upgrade --dry-run --install $(call arguments)

.PHONY: uninstall
uninstall: helm-dep
uninstall:
	@helm uninstall ${NAME} -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template: check-image-tag
template:
	@helm template $(call arguments) > template.yaml --debug 

.PHONY: force-install
force-install: uninstall
force-install: install
