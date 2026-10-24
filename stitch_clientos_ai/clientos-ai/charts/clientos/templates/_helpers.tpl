{{/*
Chart name (truncated).
*/}}
{{- define "clientos.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified resource name: <release>-<chart>.
*/}}
{{- define "clientos.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := include "clientos.name" . -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "clientos.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end -}}

{{/*
Selector labels for a component: include "clientos.selectorLabels" (dict "root" . "component" "api")
*/}}
{{- define "clientos.selectorLabels" -}}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/name: {{ .component }}
{{- end -}}

{{/*
Full image reference: <registry>/<owner>/<name>:<tag>
Usage: include "clientos.image" (dict "root" . "service" .Values.api)
*/}}
{{- define "clientos.image" -}}
{{- $tag := .service.image.tag | default .root.Values.image.tag -}}
{{- printf "%s/%s/%s:%s" .root.Values.global.imageRegistry .root.Values.image.owner .service.image.name $tag -}}
{{- end -}}

{{/*
imagePullSecrets block — include at spec.template.spec level.
Usage: include "clientos.imagePullSecrets" . | nindent 8
*/}}
{{- define "clientos.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}

{{/*
DATABASE_URL — explicit override wins, else built from the bundled postgres.
*/}}
{{- define "clientos.databaseUrl" -}}
{{- if .Values.secrets.databaseUrl -}}
{{- .Values.secrets.databaseUrl -}}
{{- else -}}
{{- printf "postgresql://%s:%s@%s-postgres:5432/%s" .Values.postgres.auth.username .Values.postgres.auth.password (include "clientos.fullname" .) .Values.postgres.auth.database -}}
{{- end -}}
{{- end -}}

{{/*
REDIS_URL — explicit override wins, else points at the bundled redis.
*/}}
{{- define "clientos.redisUrl" -}}
{{- if .Values.secrets.redisUrl -}}
{{- .Values.secrets.redisUrl -}}
{{- else -}}
{{- printf "redis://%s-redis:6379" (include "clientos.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
CORS origin for the API — explicit value wins, else derived from ingress host.
*/}}
{{- define "clientos.corsOrigin" -}}
{{- if .Values.api.env.corsOrigin -}}
{{- .Values.api.env.corsOrigin -}}
{{- else -}}
{{- printf "https://%s" .Values.ingress.host -}}
{{- end -}}
{{- end -}}

{{/*
Name of the app secrets object.
*/}}
{{- define "clientos.secretName" -}}
{{- printf "%s-secrets" (include "clientos.fullname" .) -}}
{{- end -}}
