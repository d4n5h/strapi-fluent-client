/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from "axios";
import qs from "qs";

interface Bulk {
	uuid?: string;
	id?: string;
	type: "create" | "update" | "delete";
	data?: object;
	oldData?: object;
	contentType?: string;
}

function uuid() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
}

class StrapiRequest {
	public contentType: ContentType | StrapiAtomic;
	private queryState: object;
	private url: string;

	constructor(contentType: ContentType | StrapiAtomic, atomicUrl?: string) {
		this.contentType = contentType;
		this.queryState = {};
		if (contentType instanceof StrapiAtomic) {
			this.url = "/" + atomicUrl;
		} else {
			this.url = "/" + this.contentType.name;
		}
	}

	/**
	 * Pagination
	 * @param  {object} opts
	 * @param  {number} opts.page
	 * @param  {number} opts.pageSize
	 * @param  {boolean} [opts.withCount] - Include count
	 * @returns ContentType
	 */
	public pagination(opts: {
		page: number;
		pageSize: number;
		withCount?: boolean;
	}) {
		const { page, pageSize, withCount } = opts;
		this.queryState = {
			...this.queryState,
			pagination: { page, pageSize, withCount },
		};

		return this;
	}

	/**
	 * Offset Pagination
	 * @param  {object} opts - Options
	 * @param  {number} opts.start - Start index
	 * @param  {number} opts.limit - Number of records to return
	 * @param  {boolean} [opts.withCount] - Include count
	 * @returns ContentType
	 */
	public offsetPagination(opts: {
		start: number;
		limit: number;
		withCount?: boolean;
	}) {
		const { start, limit, withCount } = opts;
		this.queryState = {
			...this.queryState,
			pagination: { start, limit, withCount },
		};

		return this;
	}

	/**
	 * Filters
	 * @param  {object} filters
	 * @returns ContentType
	 */
	public filters(filters: object) {
		this.queryState = { ...this.queryState, filters };

		return this;
	}

	/**
	 * Sort fields
	 * @param  {string[]} sort
	 * @returns ContentType
	 */
	public sort(sort: string[]) {
		this.queryState = { ...this.queryState, sort };

		return this;
	}

	/**
	 * Populate fields
	 * @param  {string[] | string | object} populate
	 * @returns ContentType
	 */
	public populate(populate: string[] | string | object) {
		this.queryState = { ...this.queryState, populate };

		return this;
	}

	/**
	 * Select fields
	 * @param  {string[]} fields
	 * @returns ContentType
	 */
	public fields(fields: string[]) {
		this.queryState = { ...this.queryState, fields };

		return this;
	}

	/**
	 * Locale
	 * @param  {string} locale - Locale
	 * @returns ContentType
	 */
	public locale(locale: string) {
		this.queryState = { ...this.queryState, locale };

		return this;
	}

	/**
	 * Publication state
	 * @param  {string} publicationState - Publication state
	 * @returns ContentType
	 */
	public publicationState(publicationState: "live" | "preview") {
		this.queryState = { ...this.queryState, publicationState };
		return this;
	}

	/**
	 * Find many records
	 * @returns Promise
	 */
	public async rawFindMany(query: string | object, toStringify = true) {
		if (toStringify) query = qs.stringify(query);
		const response = await this.contentType.instance.get(
			`${this.url}?${query}`
		);
		return response?.data;
	}

	/**
	 * Find many records
	 * @returns Promise
	 */
	public async findMany() {
		const queryStr: string = qs.stringify(this.queryState);
		const response = await this.contentType.instance.get(
			`${this.url}?${queryStr}`
		);
		return response?.data;
	}

	/**
	 * Find one record
	 * @param  {string} id
	 * @returns Promise
	 */
	public async findOne(id: string) {
		const queryStr: string = qs.stringify(this.queryState);
		const response = await this.contentType.instance.get(
			`${this.url}/${id}?${queryStr}`
		);
		return response?.data;
	}

	/**
	 * Create a record
	 * @param  {object} data
	 * @returns Promise
	 */
	public async create(data: object) {
		const response = await this.contentType.instance.post(
			`${this.url}`,
			data
		);
		return response?.data;
	}

	/**
	 * Update a record
	 * @param  {string} id
	 * @param  {object} data
	 * @returns Promise
	 */
	public async update(id: string, data: object) {
		const response = await this.contentType.instance.put(
			`${this.url}/${id}`,
			data
		);
		return response?.data;
	}

	/**
	 * Delete a record
	 * @param  {string} id
	 * @returns Promise
	 */
	public async delete(id: string) {
		const response = await this.contentType.instance.delete(
			`${this.url}/${id}`
		);
		return response?.data;
	}

	/**
	 * Authenticate user
	 * @param  {object} opts
	 * @param  {string} opts.identifier
	 * @param  {string} opts.password
	 * @returns Promise
	 */
	public async auth(opts: { identifier: string; password: string }) {
		if (this.contentType.name !== "users")
			throw new Error(
				"auth method is only available for users content type"
			);
		const { identifier, password } = opts;
		const response = await this.contentType.instance.post(`/auth/local`, {
			identifier,
			password,
		});
		return response?.data;
	}

	/**
	 * Register user
	 * @param  {object} opts
	 * @param  {string} opts.username
	 * @param  {string} opts.email
	 * @param  {string} opts.password
	 * @returns Promise
	 */
	public async register(opts: {
		username: string;
		email: string;
		password: string;
	}) {
		if (this.contentType.name !== "users")
			throw new Error(
				"auth method is only available for users content type"
			);
		const { username, email, password } = opts;
		const response = await this.contentType.instance.post(
			`/auth/local/register`,
			{
				username,
				email,
				password,
			}
		);
		return response?.data;
	}
}

class ContentType {
	name: string;
	queryState: object;
	constructor(name: string, public instance: AxiosInstance) {
		this.name = name;
		this.queryState = {};
	}

	/**
	 * Query records
	 * @returns StrapiRequest
	 */
	public query() {
		return new StrapiRequest(this);
	}

	/**
	 * Bulk operations (create, update, delete)
	 * @param  {Bulk[]} entries
	 * @returns Promise
	 */
	public async bulk(entries: Bulk[]) {
		const stack = [];
		for (const data of entries) {
			if (data.type === "create" && !data.id) {
				stack.push(new StrapiRequest(this).create(data));
			} else if (data.type === "update" && data.id && data.data) {
				stack.push(new StrapiRequest(this).update(data.id, data.data));
			} else if (data.type === "delete" && data.id) {
				stack.push(new StrapiRequest(this).delete(data.id));
			} else {
				throw new Error("Invalid bulk operation");
			}
		}

		return await Promise.all(stack);
	}
}

class StrapiClient {
	[key: string]: ContentType;

	/**
	 * Strapi Fluent API Client
	 * @param  {string} baseURL
	 * @param  {string} apiToken
	 * @returns StrapiClient
	 */
	constructor(baseURL: string, apiToken: string) {
		return new Proxy(this, {
			get: function (target, prop: string) {
				if (prop in target) {
					return target[prop];
				} else {
					return new ContentType(
						prop,
						axios.create({
							baseURL,
							headers: {
								Authorization: `Bearer ${apiToken}`,
							},
						})
					);
				}
			},
		});
	}
}

class StrapiAtomic {
	baseURL: string;
	apiToken: string;
	name: string;
	instance: AxiosInstance;
	/**
	 * Strapi Atomic Client *Experimental*
	 * @param  {string} baseURL
	 * @param  {string} apiToken
	 * @returns StrapiClient
	 */
	constructor(baseURL: string, apiToken: string) {
		this.baseURL = baseURL;
		this.apiToken = apiToken;
		this.name = "atomic";
		this.instance = axios.create({
			baseURL,
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
		});
	}

	/**
	 * Atomic bulk operations (create, update, delete)
	 * @param  {Bulk[]} operations
	 * @returns Promise
	 */
	public async atomic(operations: Bulk[]) {
		// Add uuid to each operation
		for (const operation of operations) operation.uuid = uuid();

		// Save states for rollback
		const savedStates: { [key: string]: Bulk } = {};

		for (const operation of operations) {
			if (["update", "delete"].includes(operation.type) && operation.id) {
				if (operation.uuid) {
					savedStates[operation.uuid] = {
						type: operation.type,
						oldData: await new StrapiRequest(this).findOne(
							operation.id
						),
					};
				}
			}
		}

		// Set operations stack
		const stack = [];
		for (const operation of operations) {
			if (
				operation.type === "create" &&
				!operation.id &&
				operation.data
			) {
				stack.push(
					new Promise((resolve, reject) => {
						if (operation.data) {
							new StrapiRequest(this, operation.contentType)
								.create(operation.data)
								.then((saved) => {
									if (operation.uuid) {
										savedStates[operation.uuid] = {
											type: operation.type,
											oldData: saved,
										};

										resolve(saved);
									}
								})
								.catch((error) => {
									reject(error);
								});
						}
					})
				);
			} else if (
				operation.type === "update" &&
				operation.id &&
				operation.data
			) {
				stack.push(
					new StrapiRequest(this, operation.contentType).update(
						operation.id,
						operation.data
					)
				);
			} else if (operation.type === "delete" && operation.id) {
				stack.push(
					new StrapiRequest(this, operation.contentType).delete(
						operation.id
					)
				);
			} else {
				throw new Error("Invalid bulk operation");
			}
		}

		// Rollback on error
		try {
			return await Promise.all(stack);
		} catch (error) {
			const anySavedStates = savedStates as any;
			for (const operation of operations) {
				if (operation.uuid) {
					const savedState = anySavedStates[operation.uuid];
					if (operation.type === "update" && operation.id) {
						await new StrapiRequest(
							this,
							operation.contentType
						).update(operation.id, savedState?.oldData);
					} else if (savedState.type === "delete") {
						await new StrapiRequest(
							this,
							operation.contentType
						).create(savedState?.oldData);
					} else if (
						operation.type === "create" &&
						savedState?.oldData?.id
					) {
						await new StrapiRequest(
							this,
							operation.contentType
						).delete(savedState?.oldData.id);
					}
				}
			}
			throw error;
		} finally {
			// Clean up
			for (const operation of operations) {
				if (operation.uuid) delete savedStates[operation.uuid];
			}
		}
	}
}

export { StrapiClient, StrapiAtomic, ContentType, StrapiRequest, Bulk };