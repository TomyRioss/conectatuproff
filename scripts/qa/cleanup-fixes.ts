// Limpieza de datos de prueba QA creados durante la verificación.
// Uso: npx tsx scripts/qa/cleanup-fixes.ts
import { prisma } from "../../lib/prisma";

async function main() {
  const qaUser = await prisma.user.findUnique({ where: { username: "cliente_qa_tomy" } });
  const qaClient = qaUser ? await prisma.client.findUnique({ where: { userId: qaUser.id } }) : null;
  const pro = await prisma.professional.findFirst({ where: { user: { username: "zukkodev" } } });

  if (qaUser && qaClient && pro) {
    await prisma.appointment.deleteMany({ where: { professionalId: pro.id, clientId: qaClient.id } });
    await prisma.conversation.deleteMany({ where: { professionalId: pro.id, clientId: qaClient.id } });
    await prisma.notification.deleteMany({ where: { userId: qaUser.id } });
    await prisma.user.delete({ where: { id: qaUser.id } });
    console.log("cleanup cliente QA OK");
  } else {
    console.log("no hay datos QA del cliente");
  }

  const svc = pro
    ? await prisma.service.findFirst({ where: { professionalId: pro.id, title: "Servicio QA test" } })
    : null;
  if (svc) {
    await prisma.service.delete({ where: { id: svc.id } });
    console.log("draft servicio QA borrado");
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
