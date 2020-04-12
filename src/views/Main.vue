<template>
  <v-container v-cloak>
    <h1>Welcome to CheaterChecker</h1>
    <p>Drop the files into the below uploader to get started!</p>
    <div class="dropper" v-bind:class="{ dragging }" @drop.prevent="dropFile" @dragover.prevent @dragenter="startDraggingFiles($event)"  @dragleave="stopDraggingFiles($event)">
		<v-file-input multiple label="File List" class="d-none"></v-file-input>
		<div v-if="!files.length" class="row align-center justify-center">
			<v-icon size="4em">mdi-paperclip</v-icon>
		</div>
		<v-list two-line v-if="files.length">
			<v-list-item
			v-for="file in filesWithMeta()"
			:key="file.lastModified"
			>
				<v-list-item-avatar :color="file.iconColor" light>
					<v-icon
					color="white"
					:class="[file.iconClass, file.icon]"
					>{{file.icon}}</v-icon>
				</v-list-item-avatar>

				<v-list-item-content>
					<v-list-item-title v-text="`${file.name}`"></v-list-item-title>
					<v-list-item-subtitle v-text="`${Math.round(file.size / 1024)}KB`"></v-list-item-subtitle>
				</v-list-item-content>

				<v-list-item-action>
					<v-btn v-if="file.status == 'pre'" icon v-on:click="removeFile(file.lastModified)">
						<v-icon color="red lighten-1">mdi-close</v-icon>
					</v-btn>
					<v-progress-circular v-if="['queued', 'complete'].includes(file.status) || !isNaN(file.status)"
						:indeterminate="['queued', 'complete'].includes(file.status)"
						:value="file.status * 100"
					></v-progress-circular>
					<v-icon v-if="file.status == 'success'" color="green darken-1">mdi-check</v-icon>
					<v-icon v-if="file.status == 'issues'" color="orange lighten-1" @click.stop="dialog = true" v-on:click="setCurrent(file)">mdi-check</v-icon>
					<v-tooltip top v-if="file.status == 'error'" >
						<template v-slot:activator="{ on }">
							<v-icon v-on="on" color="red lighten-1">mdi-alert-circle-outline</v-icon>
						</template>
						<span>{{file.message}}</span>						
					</v-tooltip>							
				</v-list-item-action>
			</v-list-item>
		</v-list>
    </div>
	<v-toolbar class="d-flex flex-row-reverse mt-3" color="primary">
		<v-tooltip top v-if="files.length && !appStatus.action.length > 0 ">
			<template v-slot:activator="{ on }">
				<v-btn v-on:click="clear" depressed color="blue-grey darken-2" large v-on="on"><span class="white--text">Clear All</span><v-icon color="white" class="ml-2">mdi-close</v-icon> </v-btn>
			</template>
			<span>Clear these files</span>
		</v-tooltip>		
		<v-tooltip top v-if="files.length" >
			<template v-slot:activator="{ on }">
				<v-btn :loading="appStatus.action.length > 0 " v-on:click="loadFiles" depressed color="blue darken-3" large v-on="on" class="ml-2"><span class="white--text">{{ files.length }} files</span> <v-icon color="white" class="ml-2">mdi-send</v-icon> </v-btn>
			</template>
			<span>Send {{files.length}} files for Scanning</span>
		</v-tooltip>
		<span v-if="!files.length" class="white--text">Add some files to get started!</span>
	</v-toolbar>

	<v-snackbar
		v-model="appStatus.snackbar.show"
		:timeout="2000"
		:color="appStatus.snackbar.color"
		:bottom="true"
    >
		{{ appStatus.snackbar.text }}
		<v-btn
			color="white"
			text
			@click="appStatus.snackbar.show = false"
		>
			Close
		</v-btn>
    </v-snackbar>

	<v-dialog v-if="currentFile" v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
		<v-card>
			<v-toolbar dark color="primary">
				<v-btn icon dark @click="setCurrent(null)">
					<v-icon>mdi-close</v-icon>
				</v-btn>
				<v-toolbar-title>{{currentFile.name}}</v-toolbar-title>
				<v-spacer></v-spacer>
			</v-toolbar>
			<v-list three-line>
				<template v-for="(problem, index) in currentFile.scanData">
					<v-divider
					:key="index"
					:inset="true"
					></v-divider>				
					<v-list-item :key="index +'.item'">
						<v-list-item-content>
							<v-list-item-title >Student</v-list-item-title>
							<v-list-item-subtitle v-html="problem.query"></v-list-item-subtitle>
							<v-list-item-title>Wikipedia <a target="_blank" v-bind:href="'https://en.wikipedia.org/?curid=' + problem.results[0].pageid">({{problem.results[0].title}})</a></v-list-item-title>
							<v-list-item-subtitle><em>Similarity: <span class="score" v-bind:style="{backgroundColor: getScoreColor(problem.similarity.score)}" >{{Math.round(problem.similarity.score)}}</span></em></v-list-item-subtitle>						
							<v-list-item-subtitle v-html="problem.results[0].snippet"></v-list-item-subtitle>				
						</v-list-item-content>				
					</v-list-item>
				</template>
			</v-list>
		</v-card>
	</v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import "../scss/styles.scss";

interface FileMeta {
	icon?: string;
	iconClass?: string;
	iconColor?: string;
	status: string|number;
	uuid?: string;
	message?: string;
	scanData?: [];	
}

interface FileWithMeta extends File, FileMeta {

}

export default Vue.extend({
	name: "Main",

	data()  { 
		return {
			files: [] as File[],
			fileMeta: {} as Record<number, FileMeta>,
			monitors: {} as Record<string, EventSource>,
			dragging: false as boolean,
			currentFile: null as FileWithMeta|null,
			appStatus: {
				action: '' as string,
				snackbar: {

				}
			}
		}
	},

	watch: {

	},
	methods: {
		filesWithMeta: function() {
			return Array.from(this.files).map( (file) => {
				return Object.assign(file, this.fileMeta[file.lastModified]);
			});
		},
		dropFile: function(e: DragEvent) {
			this.stopDraggingFiles(e);
			const transfer: DataTransfer = e.dataTransfer || new DataTransfer;
			this.files.push(...Array.from(transfer.files));
			this.files.forEach( file => {
				Vue.set(this.fileMeta, file.lastModified, {
					icon: this.getFileIcon(file.type),
					iconColor: this.getFileIconColor(file.type),
					iconClass: 'blue white--text',
					status: 'pre'
				});
			})
		},

		startDraggingFiles: function(e: DragEvent) {
			this.dragging = true;
		},

		stopDraggingFiles: function(e: DragEvent) {
			this.dragging = false;
		},

		clear: function() {
			this.files = [];
			this.fileMeta = {};
			this.appStatus.action = '';
		},

		setCurrent: function(file: FileWithMeta|null) {
			console.log(file);
			this.currentFile = file;
		},

		removeFile: function(removeFile: number) {
			this.files = this.files.filter( file => file.lastModified != removeFile );
			delete this.fileMeta[removeFile];
		},

		loadFiles: async function() {
			this.appStatus.action = 'uploading';
			for (let i = 0; i < this.files.length; i++) {
				const file = this.files[i];
				try {
					const n = file.lastModified;
					this.fileMeta[n].status = 'searching';
					this.fileMeta[n].uuid = await this.queue(file);
					this.fileMeta[n].status = 'queued';
					this.listen(this.fileMeta[n]);
				} catch (e) {
					this.fileMeta[file.lastModified].status = 'error';
					this.fileMeta[file.lastModified].message = e.message;
					this.appStatus.snackbar = {
						text: e.message,
						color: 'red',
						show: true
					}
				}
			}
			this.appStatus.action = '';

		},

		listen: function(file: FileMeta) {
			if (file.uuid) {
				this.monitors[file.uuid] = new EventSource(`/api/status/${file.uuid}`);
				const event = this.monitors[file.uuid];

				event.onmessage = (ev) => {
					const parsed = JSON.parse(ev.data);
					this.appStatus.action = 'processing';
					file.status = parsed.status;
					if(file.status === 'complete') {
						event.close();
						this.getResults(file);
						delete this.monitors[file.uuid || ''];
					}
				};

				event.onerror = () => {
					event.close();
					file.status = 'error';
					delete this.monitors[file.uuid || ''];
					if (!this.monitors.length) {
						this.appStatus.action = '';
					}
				}
			}

		},

		getResults: async function(file: FileMeta) {
			const resp = await fetch(`/api/results/${file.uuid}`, {
				method: 'GET'
			});
			const json = await resp.json();
			
			if ( resp.status !== 200) { console.log(json.error); throw new Error(json.error)}
			file.scanData = json;
			if ( json.length ) {
				file.status = "issues";
			} else {
				file.status = "success";
			}

			if( !Object.keys(this.monitors).length ) {
				this.appStatus.action = '';
			}
		},

		queue: async function(file: File): Promise<string> {
			const formData = new FormData();
			formData.append('document', file, file.name);
		
			const resp = await fetch('/api/check', {
				method: 'POST',
				body: formData
			});
			const json = await resp.json();
			
			if ( resp.status !== 200) { console.log(json.error); throw new Error(json.error)}
			
			return json.uuid;

		},

		getScoreColor(score: number): string{
			if ( score < 17 ) return '#FFCA28';
			if ( score < 22 ) return '#FFA726';
			return '#EF5350';
		},

		getFileIcon(type?: string): string {
			switch (type) {
				case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
					return 'mdi-file-document'
				case 'application/vnd.ms-powerpoint':
				case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
					return 'mdi-presentation-play';
				case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
				case 'application/vnd.ms-excel':
					return 'mdi-file-table'
				case 'application/pdf' :
					return 'mdi-adobe-acrobat';					
				case 'application/json' :
					return 'mdi-code-json';				
				default :
					return 'mdi-file-document'
			}
		},

		getFileIconColor(type?: string): string {
			switch (type) {
				case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
					return 'primary'
				case 'application/vnd.ms-powerpoint':
				case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
					return 'amber lighten-1';
				case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
				case 'application/vnd.ms-excel':
					return 'green darken-1';
				case 'application/json' :
					return 'orange lighten-1';
				case 'application/pdf' :
					return 'red lighten-1';				
				default :
					return 'primary';
			}
		}	
	}
});
</script>
