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
					<v-progress-circular v-if="file.status == 'searching'"
						:indeterminate="true"
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
		<v-tooltip top v-if="files.length && !appStatus.uploading">
			<template v-slot:activator="{ on }">
				<v-btn v-on:click="clear" depressed color="blue-grey darken-2" large v-on="on"><span class="white--text">Clear All</span><v-icon color="white" class="ml-2">mdi-close</v-icon> </v-btn>
			</template>
			<span>Clear these files</span>
		</v-tooltip>		
		<v-tooltip top v-if="files.length" >
			<template v-slot:activator="{ on }">
				<v-btn :loading="appStatus.uploading" v-on:click="loadFiles" depressed color="blue darken-3" large v-on="on" class="ml-2"><span class="white--text">{{ files.length }} files</span> <v-icon color="white" class="ml-2">mdi-send</v-icon> </v-btn>
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
		<v-list>
			<v-list-item 			
				v-for="problem in currentFile.scanData"
				:key="problem.results[0].pageid"
			>
			<h3>Student Wrote</h3>
				{{problem.query}}
			<h3>Wikipedia</h3>
				<span v-html="problem.results[0].snippet"></span>
			</v-list-item>
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
	status: string;
	message?: string;
	scanData?: [];	
}

interface FileWithMeta extends File, FileMeta {

}

interface PageData {
	files: File[];
	fileMeta: Record<number, FileMeta>;
	currentFile: FileWithMeta|null;
	appStatus: {
		uploading?: boolean;
		snackbar?: {};
	};
	dragging: boolean;
}
const data: PageData = {
	files: [],
	fileMeta: {},
	dragging: false,
	currentFile: null,
	appStatus: {
		snackbar: {

		}
	}
}
export default Vue.extend({
  name: "Main",

  data: () => (data),

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
			this.fileMeta[file.lastModified] = {
				icon: this.getFileIcon(file.type),
				iconColor: this.getFileIconColor(file.type),
				iconClass: 'blue white--text',
				status: 'pre'
			}

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
		this.appStatus.uploading = false;

		this.$forceUpdate();
	},

	setCurrent: function(file: FileWithMeta|null) {
		console.log(file);
		this.currentFile = file;

		this.$forceUpdate();
	},

	removeFile: function(removeFile: number) {
		this.files = this.files.filter( file => file.lastModified != removeFile );
		delete this.fileMeta[removeFile];
	},

	loadFiles: async function() {
		this.appStatus.uploading = true;
		for (let i = 0; i < this.files.length; i++) {
			if (this.appStatus.uploading) {
				const file = this.files[i];
				try {
					const n = file.lastModified;
					this.fileMeta[n].status = 'searching';
					this.$forceUpdate();
					this.fileMeta[n].scanData = await this.getText(file);
					this.fileMeta[n].status = this.fileMeta[n].scanData?.length ? 'issues' : 'success';
					this.$forceUpdate();
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
		}
		this.appStatus.uploading = false;

		this.$forceUpdate();
	},

	getText: async function(file: File): Promise<[]> {
		const formData = new FormData();
		formData.append('document', file, file.name);
	
		const resp = await fetch('/api/check', {
			method: 'POST',
			body: formData
		});
		const json = await resp.json();
		
		if ( resp.status !== 200) { console.log(json.error); throw new Error(json.error)}
		
		return json;

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
