export const supportedLocales = ['es', 'en'] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'es'

export function isLocale(value: string | undefined): value is Locale {
  return value === 'es' || value === 'en'
}

export const translations = {
  es: {
    clientManagementSystem: 'Sistema de gestión de clientes',

    dashboard: 'Panel principal',
    welcome: 'Bienvenida a Janet',
    workspace: 'Tu espacio de gestión de clientes.',

    googleCalendar: 'Google Calendar',
    connectCalendarTitle: 'Conecta Janet con Google Calendar',
    connectCalendarDescription:
      'Gestiona automáticamente los eventos del calendario relacionados con los plazos de tus clientes.',
    connectCalendar: 'Conectar Google Calendar',
    reconnectCalendar: 'Reconectar Google Calendar',
    calendarConnected: 'Google Calendar conectado',

    clients: 'Clientes',
    activeCases: 'Expedientes activos',
    tasks: 'Tareas',
    viewClients: 'Ver clientes →',
    viewCases: 'Ver expedientes →',
    viewTasks: 'Ver tareas →',

    management: 'Gestión',
    manageClients: 'Gestiona tus clientes y su información.',
    addClient: 'Añadir cliente',
    unableToLoadClients: 'No se pueden cargar los clientes',
    client: 'Cliente',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    nationality: 'Nacionalidad',
    noClientsYet: 'Aún no hay clientes',
    addFirstClientDescription:
      'Añade tu primer cliente para empezar a gestionar su información.',
    addFirstClient: 'Añadir primer cliente',

    backToClients: '← Volver a clientes',
    clientProfile: 'Ficha del cliente',
    clientInformationWorkspace:
      'Información del cliente y espacio de gestión de expedientes.',

    personalInformation: 'Datos personales',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    dateOfBirth: 'Fecha de nacimiento',
    passportNumber: 'Número de pasaporte',

    contactInformation: 'Datos de contacto',

    address: 'Dirección',
    city: 'Ciudad',
    postalCode: 'Código postal',

    notes: 'Notas',
    noNotesAdded: 'No se han añadido notas.',

    immigration: 'Extranjería',
    immigrationDeadlines: 'Plazos de extranjería',
    immigrationDeadlinesDescription:
      'Fechas importantes de renovación calculadas a partir de los documentos de extranjería.',
    deadline: 'plazo',
    deadlines: 'plazos',
    noImmigrationDeadlines: 'No hay plazos de extranjería',
    noImmigrationDeadlinesDescription:
      'Añade un TIE con fecha de caducidad para calcular su plazo de renovación.',

    tieRenewal: 'Renovación del TIE',
    overdue: 'Vencido',
    dueToday: 'Vence hoy',
    upcoming: 'Próximo',
    renewalActionDate: 'Fecha de actuación para la renovación',
    tieExpires: 'El TIE caduca',
    document: 'Documento',
    openCase: 'Abrir expediente →',

    needsAttention: 'Requiere atención',
    item: 'elemento',
    items: 'elementos',
    needsAttentionDescription:
      'Elementos que pueden requerir una actuación próximamente.',
    nothingNeedsAttention: 'No hay nada que requiera atención',
    nothingNeedsAttentionDescription:
      'No hay tareas vencidas ni documentos próximos a caducar.',

    overdueTask: 'Tarea vencida',
    due: 'Vence',
    taskDueToday: 'Tarea con vencimiento hoy',
    today: 'Hoy',
    upcomingTask: 'Próxima tarea',

    expiredDocument: 'Documento caducado',
    expired: 'Caducado',
    documentExpiringSoon: 'Documento próximo a caducar',
    expires: 'Caduca',

    cases: 'Expedientes',
    manageCases:
      'Gestiona los expedientes legales y administrativos de este cliente.',
    addCase: 'Añadir expediente',
    unableToLoadCases: 'No se pueden cargar los expedientes',
    noCasesYet: 'Aún no hay expedientes',
    createFirstCase: 'Crea el primer expediente para este cliente.',
    addFirstCase: 'Añadir primer expediente',
    opened: 'Fecha de apertura',
    noCaseNumber: 'Sin número de expediente',

    documents: 'Documentos',
    caseTasks: 'Tareas',
    clientManagementSystemShort: 'Sistema de gestión de clientes',
    addressSection: 'Dirección',
    caseNumber: 'Número de expediente',
    caseWorkspace: 'Espacio del expediente',
    caseOverview: 'Resumen del expediente',
    caseType: 'Tipo de expediente',
    status: 'Estado',
    closed: 'Cerrado',
    description: 'Descripción',
    noDescription: 'No se ha añadido ninguna descripción.',
    addDocument: 'Añadir documento',
    view: 'Ver',
    addTask: 'Añadir tarea',
    caseActivity: 'Actividad del expediente',
    caseActivityDescription: 'La actividad del expediente aparecerá aquí a medida que avance.',
    tasksDescription: 'Realiza un seguimiento del trabajo que debe completarse para este expediente.',
    renewalActionDateShort: 'Fecha de actuación para la renovación',
    active: 'Activo',
    immigrationCaseType: 'Inmigración',
    residenceRenewal: 'Renovación de residencia',

    addNewClient: 'Añadir nuevo cliente',
    clientManagementDescription: 'Añade un nuevo cliente a Janet.',
    saveClient: 'Guardar cliente',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    backToCase: '← Volver al expediente',
    backToClient: '← Volver al cliente',
    addNewCase: 'Añadir expediente',
    newCaseDescription: 'Crea un nuevo expediente para este cliente.',
    saveCase: 'Guardar expediente',
    savingCase: 'Guardando...',
    addNewTask: 'Añadir tarea',
    newTaskDescription: 'Crea una tarea para este expediente.',
    saveTask: 'Guardar tarea',
    savingTask: 'Guardando...',
    caseDocuments: 'Documentos del expediente',
    caseDocumentsDescription: 'Guarda y gestiona los documentos de este expediente.',
    noDocumentsYet: 'Aún no hay documentos',
    noDocumentsDescription: 'Los documentos añadidos a este expediente aparecerán aquí.',
    noTasksYet: 'Aún no hay tareas',
    noTasksDescription: 'Las tareas y los plazos de este expediente aparecerán aquí.',
    delete: 'Eliminar',
    deleting: 'Eliminando...',
    reopen: 'Reabrir',
    deletingDocumentConfirmation:
      '¿Seguro que quieres eliminar permanentemente este documento y el archivo subido?',
    deletingTaskConfirmation:
      '¿Seguro que quieres eliminar esta tarea?',
  },

  en: {
    clientManagementSystem: 'Client Management System',

    dashboard: 'Dashboard',
    welcome: 'Welcome to Janet',
    workspace: 'Your client management workspace.',

    googleCalendar: 'Google Calendar',
    connectCalendarTitle: 'Connect Janet to Google Calendar',
    connectCalendarDescription:
      'Automatically manage calendar events for your client deadlines.',
    connectCalendar: 'Connect Google Calendar',
    reconnectCalendar: 'Reconnect Google Calendar',
    calendarConnected: 'Google Calendar connected',

    clients: 'Clients',
    activeCases: 'Active Cases',
    tasks: 'Tasks',
    viewClients: 'View clients →',
    viewCases: 'View cases →',
    viewTasks: 'View tasks →',

    management: 'Management',
    manageClients: 'Manage your clients and their information.',
    addClient: 'Add Client',
    unableToLoadClients: 'Unable to load clients',
    client: 'Client',
    email: 'Email',
    phone: 'Phone',
    nationality: 'Nationality',
    noClientsYet: 'No clients yet',
    addFirstClientDescription:
      'Add your first client to start managing their information.',
    addFirstClient: 'Add your first client',

    backToClients: '← Back to Clients',
    clientProfile: 'Client Profile',
    clientInformationWorkspace:
      'Client information and case workspace.',

    personalInformation: 'Personal Information',
    firstName: 'First name',
    lastName: 'Last name',
    dateOfBirth: 'Date of birth',
    passportNumber: 'Passport number',

    contactInformation: 'Contact Information',

    address: 'Address',
    city: 'City',
    postalCode: 'Postal code',

    notes: 'Notes',
    noNotesAdded: 'No notes added.',

    immigration: 'Immigration',
    immigrationDeadlines: 'Immigration Deadlines',
    immigrationDeadlinesDescription:
      'Important renewal dates calculated from immigration documents.',
    deadline: 'deadline',
    deadlines: 'deadlines',
    noImmigrationDeadlines: 'No immigration deadlines',
    noImmigrationDeadlinesDescription:
      'Add a TIE with an expiry date to calculate its renewal deadline.',

    tieRenewal: 'TIE renewal',
    overdue: 'Overdue',
    dueToday: 'Due today',
    upcoming: 'Upcoming',
    renewalActionDate: 'Renewal action date',
    tieExpires: 'TIE expires',
    document: 'Document',
    openCase: 'Open case →',

    needsAttention: 'Needs Attention',
    item: 'item',
    items: 'items',
    needsAttentionDescription:
      'Items that may need action soon.',
    nothingNeedsAttention: 'Nothing needs attention',
    nothingNeedsAttentionDescription:
      'No overdue tasks or documents approaching expiry.',

    overdueTask: 'Overdue task',
    due: 'Due',
    taskDueToday: 'Task due today',
    today: 'Today',
    upcomingTask: 'Upcoming task',

    expiredDocument: 'Expired document',
    expired: 'Expired',
    documentExpiringSoon: 'Document expiring soon',
    expires: 'Expires',

    cases: 'Cases',
    manageCases:
      'Manage legal and administrative cases for this client.',
    addCase: 'Add Case',
    unableToLoadCases: 'Unable to load cases',
    noCasesYet: 'No cases yet',
    createFirstCase: 'Create the first case for this client.',
    addFirstCase: 'Add First Case',
    opened: 'Opened',
    noCaseNumber: 'No case number',

    documents: 'Documents',
    caseTasks: 'Tasks',
    clientManagementSystemShort: 'Client Management System',
    addressSection: 'Address',
    caseNumber: 'Case number',
    caseWorkspace: 'Case Workspace',
    caseOverview: 'Case Overview',
    caseType: 'Case type',
    status: 'Status',
    closed: 'Closed',
    description: 'Description',
    noDescription: 'No description added.',
    addDocument: 'Add Document',
    view: 'View',
    addTask: 'Add Task',
    caseActivity: 'Case Activity',
    caseActivityDescription: 'Case activity will appear here as the case progresses.',
    tasksDescription: 'Track work that needs to be completed for this case.', 
    renewalActionDateShort: 'Renewal action date',
    active: 'Active',
    immigrationCaseType: 'Immigration',
    residenceRenewal: 'Residence Renewal',

    addNewClient: 'Add New Client',
    clientManagementDescription: 'Add a new client to Janet.',
    saveClient: 'Save Client',
    saving: 'Saving...',
    cancel: 'Cancel',
    backToCase: '← Back to Case',
    backToClient: '← Back to Client',
    addNewCase: 'Add Case',
    newCaseDescription: 'Create a new case for this client.',
    saveCase: 'Save Case',
    savingCase: 'Saving...',
    addNewTask: 'Add Task',
    newTaskDescription: 'Create a task for this case.',
    saveTask: 'Save Task',
    savingTask: 'Saving...',
    caseDocuments: 'Case Documents',
    caseDocumentsDescription: 'Store and manage documents for this case.',
    noDocumentsYet: 'No documents yet',
    noDocumentsDescription: 'Documents added for this case will appear here.',
    noTasksYet: 'No tasks yet',
    noTasksDescription: 'Tasks and deadlines for this case will appear here.',
    delete: 'Delete',
    deleting: 'Deleting...',
    reopen: 'Reopen',
    deletingDocumentConfirmation:
      'Are you sure you want to permanently delete this document and its uploaded file?',
    deletingTaskConfirmation:
      'Are you sure you want to delete this task?',
  },
} as const
